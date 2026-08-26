const Product = require('../models/Product');
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Extract filters from user query (e.g., "pink shoes under ₹2000")
const extractFilters = (query) => {
  const filters = {};
  const lowerQuery = query.toLowerCase();
  
  // Category filter
  const categories = ['electronics', 'fashion', 'home', 'books'];
  const matchedCategory = categories.find(cat => lowerQuery.includes(cat));
  if (matchedCategory) filters.category = matchedCategory;
  
  // Price filter
  const priceMatch = lowerQuery.match(/under ₹?(\d+)/);
  if (priceMatch) filters.price = { $lte: parseInt(priceMatch[1]) };
  
  return filters;
};

// Generate embedding for user query
const generateQueryEmbedding = async (query) => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: query,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating query embedding:", error);
    throw error;
  }
};

// Hybrid search: Structured + Vector
const searchProducts = async (query) => {
  // Step 1: Generate query embedding
  const queryEmbedding = await generateQueryEmbedding(query);
  
  // Step 2: Vector search
  const vectorSearchPipeline = [
    {
      $vectorSearch: {
        index: process.env.VECTOR_SEARCH_INDEX || "vector_index",
        path: "embedding",
        queryVector: queryEmbedding,
        limit: 5,
        numCandidates: 100,
      },
    },
    {
      $match: {
        embedding: { $exists: true, $ne: null },
      },
    },
  ];
  
  let products = await Product.aggregate(vectorSearchPipeline);
  
  // Step 3: Apply structured filters if no results from vector search
  if (products.length === 0) {
    const filters = extractFilters(query);
    products = await Product.find(filters).limit(5);
  }
  
  // Step 4: Fallback to keyword search if no results
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

// Generate AI response using retrieved products
const generateAIResponse = async (query, products) => {
  try {
    const productContext = products.map(product =>
      `Product: ${product.name}\nDescription: ${product.description}\nPrice: ₹${product.price}\nCategory: ${product.category}\n`
    ).join("\n\n");
    
    const systemPrompt = `
      You are an AI shopping assistant for an e-commerce store.
      Answer the user's query using ONLY the provided product context.
      If no relevant products are found, say: "Sorry, I couldn't find any matching products."
      If products are found, list them with their name, price, and category.
      Do NOT invent products, prices, or features.
      Keep responses concise and relevant.
    `;
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Query: ${query}\n\nProducts:\n${productContext}` }
      ],
      max_tokens: 200,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Error generating AI response:", error);
    return "Sorry, I'm unable to process your request right now. Please try again.";
  }
};

module.exports = { searchProducts, generateAIResponse };