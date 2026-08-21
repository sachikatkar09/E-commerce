const Product = require('../models/Product');

// Extract filters from user query (e.g., "pink shoes under ₹2000")
const extractFilters = (query) => {
  const filters = {};
  const lowerQuery = query.toLowerCase();
  
  // Category filter
  const categories = ['electronics', 'fashion', 'home', 'books'];
  const matchedCategory = categories.find(cat => lowerQuery.includes(cat));
  if (matchedCategory) filters.category = matchedCategory;
  
  // Price filter
  const priceMatch = lowerQuery.match(/under ₹(\d+)/);
  if (priceMatch) filters.price = { $lte: parseInt(priceMatch[1]) };
  
  return filters;
};

// Hybrid search: Structured + Vector (placeholder for vector search)
const searchProducts = async (query) => {
  // Step 1: Structured search
  const filters = extractFilters(query);
  let products = await Product.find(filters).limit(5);
  
  // Step 2: Fallback to keyword search if no results
  if (products.length === 0) {
    products = await Product.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } }
      ]
    }).limit(5);
  }
  
  return products;
};

module.exports = { searchProducts };