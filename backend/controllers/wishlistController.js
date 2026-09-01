const Wishlist = require("../models/Wishlist");

// Get user's wishlist
const getWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user._id }).populate('items');
    if (!wishlist) {
      return res.json({ items: [] });
    }
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add item to wishlist
const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }
    
    // Check if product already exists in wishlist
    const existingItemIndex = wishlist.items.findIndex(item => 
      item.toString() === productId.toString()
    );
    
    if (existingItemIndex >= 0) {
      // Product already in wishlist
      return res.status(400).json({ message: 'Product already in wishlist' });
    }
    
    // Add new item
    wishlist.items.push(productId);
    await wishlist.save();
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove item from wishlist
const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    wishlist.items = wishlist.items.filter(item => item.toString() !== productId.toString());
    await wishlist.save();
    
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Toggle item in wishlist
const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    
    let wishlist = await Wishlist.findOne({ user: req.user._id });
    
    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user._id, items: [] });
    }
    
    // Check if product already exists in wishlist
    const existingItemIndex = wishlist.items.findIndex(item => 
      item.toString() === productId.toString()
    );
    
    if (existingItemIndex >= 0) {
      // Remove from wishlist
      wishlist.items = wishlist.items.filter(item => item.toString() !== productId.toString());
    } else {
      // Add to wishlist
      wishlist.items.push(productId);
    }
    
    await wishlist.save();
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Check if product is in wishlist
const isInWishlist = async (req, res) => {
  try {
    const { productId } = req.params;
    
    const wishlist = await Wishlist.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.json({ isWishlisted: false });
    }
    
    const isWishlisted = wishlist.items.some(item => item.toString() === productId.toString());
    res.json({ isWishlisted });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist };