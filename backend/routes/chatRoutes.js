const express = require("express");
const router = express.Router();
const Product = require("../../models/Product");

router.post("/chat", async (req, res) => {
  try {
    const { message, context } = req.body;
    
    // Extract intent and filters (mock for now)
    const { query, filters } = extractIntent(message, context);
    
    // Fetch products from the existing API
    const products = await Product.find(filters).limit(3);
    
    // Generate AI response (mock for now)
    const aiResponse = generateAIResponse(query, products);
    
    res.json({
      message: aiResponse,
      products,
    });
  } catch (error) {
    res.status(500).json({ message: "Sorry, I couldn't process your request." });
  }
});

// Mock intent extraction
const extractIntent = (message, context) => {
  // Example: "pink shoes under ₹2000" -> query: "pink shoes", filters: { price: { $lt: 2000 } }
  const filters = context?.filters || {};
  let query = context?.query || message;
  
  if (message.includes("under")) {
    const price = parseInt(message.split("under")[1].trim().replace(/[^0-9]/g, ""));
    if (!isNaN(price)) {
      filters.price = { $lt: price };
    }
    query = message.split("under")[0].trim();
  }
  
  return { query, filters };
};

// Mock AI response generation
const generateAIResponse = (query, products) => {
  if (products.length === 0) {
    return "Sorry, I couldn't find any products matching your request.";
  }
  return `I found these ${query} for you:`;
};

module.exports = router;