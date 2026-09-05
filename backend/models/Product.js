const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true },
    stock: { type: Number, required: true },
    imageUrl: { type: String, required: true },
    ratings: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    originalPrice: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0 },
  },
  { timestamps: true },
);

productSchema.pre("save", async function (next) {
  const basePrice =
    Number(this.originalPrice) > 0
      ? Number(this.originalPrice)
      : Number(this.price);
  this.originalPrice = Number(basePrice.toFixed(2));

  if (Number(this.discountPercentage) > 0) {
    this.discountPrice = Number(
      (
        (this.originalPrice * (100 - Number(this.discountPercentage))) /
        100
      ).toFixed(2),
    );
  } else {
    this.discountPrice = Number(this.price);
  }

  next();
});

module.exports = mongoose.model("Product", productSchema);
