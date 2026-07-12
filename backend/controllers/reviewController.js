const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Order = require("../models/Order");
const cloudinary = require("../config/cloudinary");

const uploadFilesToCloudinary = async (files) => {
  const images = [];
  for (const file of files) {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "shopnest/reviews",
      resource_type: "image",
    });
    images.push(result.secure_url);
    try {
      fs.unlinkSync(file.path);
    } catch (err) {
      console.warn("Unable to remove temp upload file:", file.path);
    }
  }
  return images;
};

const updateProductRatingStats = async (productId) => {
  const stats = await Review.aggregate([
    { $match: { productId: mongoose.Types.ObjectId(productId) } },
    {
      $group: {
        _id: null,
        averageRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  const product = await Product.findById(productId);
  if (!product) return;

  if (stats.length > 0) {
    product.ratings = Math.round(stats[0].averageRating * 10) / 10;
    product.numReviews = stats[0].totalReviews;
  } else {
    product.ratings = 0;
    product.numReviews = 0;
  }
  await product.save();
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Number(req.query.page) || 1;
    const size = Number(req.query.size) || 6;
    const ratingFilter = Number(req.query.rating) || null;
    const photosOnly = req.query.photos === "true";
    const verifiedOnly = req.query.verified === "true";
    const sortOption = req.query.sort || "MostRecent";

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const filter = { productId: mongoose.Types.ObjectId(productId) };
    if (ratingFilter) filter.rating = ratingFilter;
    if (photosOnly) filter.images = { $exists: true, $ne: [] };
    if (verifiedOnly) filter.verifiedPurchase = true;

    const sortMap = {
      MostRecent: { createdAt: -1 },
      HighestRating: { rating: -1, createdAt: -1 },
      LowestRating: { rating: 1, createdAt: -1 },
      MostHelpful: { helpfulCount: -1, createdAt: -1 },
    };

    const allReviewStats = await Review.aggregate([
      { $match: { productId: mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: "$rating",
          count: { $sum: 1 },
        },
      },
    ]);

    const distribution = [5, 4, 3, 2, 1].map((value) => {
      const bucket = allReviewStats.find((item) => item._id === value);
      return { rating: value, count: bucket ? bucket.count : 0 };
    });

    const overallStats = await Review.aggregate([
      { $match: { productId: mongoose.Types.ObjectId(productId) } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          verifiedReviews: { $sum: { $cond: ["$verifiedPurchase", 1, 0] } },
          photoReviews: {
            $sum: { $cond: [{ $gt: [{ $size: "$images" }, 0] }, 1, 0] },
          },
        },
      },
    ]);

    const stats = overallStats[0] || {
      averageRating: 0,
      totalReviews: 0,
      verifiedReviews: 0,
      photoReviews: 0,
    };

    const reviewDocs = await Review.aggregate([
      { $match: filter },
      { $addFields: { helpfulCount: { $size: "$helpfulUsers" } } },
      { $sort: sortMap[sortOption] || { createdAt: -1 } },
      { $skip: (page - 1) * size },
      { $limit: size },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          rating: 1,
          title: 1,
          description: 1,
          images: 1,
          verifiedPurchase: 1,
          helpfulUsers: 1,
          helpfulCount: 1,
          createdAt: 1,
          updatedAt: 1,
          user: { _id: "$user._id", name: "$user.name" },
        },
      },
    ]);

    const filteredCount = await Review.countDocuments(filter);

    const currentUserReview = req.user
      ? await Review.findOne({
          productId: mongoose.Types.ObjectId(productId),
          userId: req.user._id,
        })
      : null;

    const userHasPurchased = req.user
      ? Boolean(
          await Order.exists({
            userId: req.user._id,
            "items.productId": mongoose.Types.ObjectId(productId),
          }),
        )
      : false;

    const reviews = reviewDocs.map((review) => ({
      _id: review._id,
      user: {
        _id: review.user?._id,
        name: review.user?.name || "Anonymous",
      },
      rating: review.rating,
      title: review.title,
      description: review.description,
      images: review.images,
      verifiedPurchase: review.verifiedPurchase,
      helpfulCount: review.helpfulCount || 0,
      hasVoted: req.user
        ? (review.helpfulUsers || []).some((id) => id.equals(req.user._id))
        : false,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    }));

    res.json({
      reviews,
      page,
      pages: Math.ceil(filteredCount / size),
      totalFiltered: filteredCount,
      stats: {
        averageRating: Math.round(stats.averageRating * 10) / 10,
        totalReviews: stats.totalReviews,
        verifiedCount: stats.verifiedReviews,
        photoCount: stats.photoReviews,
        distribution,
      },
      userReview: currentUserReview
        ? {
            _id: currentUserReview._id,
            rating: currentUserReview.rating,
            title: currentUserReview.title,
            description: currentUserReview.description,
            images: currentUserReview.images,
            verifiedPurchase: currentUserReview.verifiedPurchase,
          }
        : null,
      userHasPurchased,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, description } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    const existingReview = await Review.findOne({
      productId,
      userId: req.user._id,
    });
    if (existingReview) {
      return res
        .status(400)
        .json({
          message:
            "You already reviewed this product. Edit your existing review.",
        });
    }

    const verifiedPurchase = Boolean(
      await Order.exists({
        userId: req.user._id,
        "items.productId": mongoose.Types.ObjectId(productId),
      }),
    );

    let images = [];
    if (req.files && req.files.length > 0) {
      images = await uploadFilesToCloudinary(req.files);
    }

    const review = await Review.create({
      userId: req.user._id,
      productId,
      rating: Number(rating),
      title,
      description,
      images,
      verifiedPurchase,
      helpfulUsers: [],
    });

    await updateProductRatingStats(productId);
    res.status(201).json(review);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, description } = req.body;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!review.userId.equals(req.user._id)) {
      return res
        .status(403)
        .json({ message: "Not authorized to update this review" });
    }

    review.rating = Number(rating) || review.rating;
    review.title = title || review.title;
    review.description = description || review.description;

    if (req.files && req.files.length > 0) {
      const uploaded = await uploadFilesToCloudinary(req.files);
      review.images = [...review.images, ...uploaded];
    }

    const updatedReview = await review.save();
    await updateProductRatingStats(review.productId);
    res.json(updatedReview);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (!review.userId.equals(req.user._id) && req.user.role !== "admin") {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this review" });
    }

    await review.deleteOne();
    await updateProductRatingStats(review.productId);
    res.json({ message: "Review removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markReviewHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ message: "Review not found" });
    if (review.helpfulUsers.some((id) => id.equals(req.user._id))) {
      return res
        .status(400)
        .json({ message: "You already marked this review helpful" });
    }

    review.helpfulUsers.push(req.user._id);
    await review.save();
    res.json({ helpfulCount: review.helpfulUsers.length });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful,
};
