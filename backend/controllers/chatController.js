'use strict';

const { searchProducts, generateAIResponse } = require('../services/ragService');

exports.chat = async (req, res) => {
  try {
    const { message: query, context } = req.body;
    
    if (!query) {
      return res.status(400).json({ message: "Query is required." });
    }
    
    // Step 1: Retrieve relevant products
    const products = await searchProducts(query);
    
    // Step 2: Generate AI response using retrieved products
    const aiResponse = await generateAIResponse(query, products);
    
    res.status(200).json({
      success: true,
      message: aiResponse,
      products: products.map(product => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        stock: product.stock,
        ratings: product.ratings || 0,
      })),
    });
  } catch (error) {
    console.error('[chatController] Error:', error);
    res.status(500).json({
      success: false,
      message: "Sorry, I'm unable to process your request right now. Please try again."
    });
  }
};