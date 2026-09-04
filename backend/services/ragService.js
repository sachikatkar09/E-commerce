const Product = require("../models/Product");
const { generateEmbedding } = require("./embeddingService");
const { get_namespace } = require("../config/pinecone");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const LLM_MODEL = process.env.GEMINI_LLM_MODEL || "gemini-2.0-flash";

const extractFilters = (query) => {
  const filters = {};
  const lowerQuery = query.toLowerCase();

  const categories = [
    "electronics",
    "fashion",
    "home",
    "books",
    "beauty",
    "toys",
    "sports",
    "grocery",
  ];
  const matchedCategory = categories.find((cat) => lowerQuery.includes(cat));
  if (matchedCategory) filters.category = matchedCategory;

  const priceMatch = lowerQuery.match(/under ₹?(\d+)/);
  if (priceMatch) filters.price = { $lte: parseInt(priceMatch[1]) };

  return filters;
};

const searchProducts = async (query) => {
  try {
    const queryEmbedding = await generateEmbedding(query);
    const namespace = await get_namespace();

    const results = await namespace.query({
      vector: queryEmbedding,
      topK: 8,
      includeMetadata: true,
    });

    const matchedIds = results.matches
      .filter((m) => m.score >= 0.5)
      .map((m) => m.id);

    let products = [];
    if (matchedIds.length > 0) {
      products = await Product.find({ _id: { $in: matchedIds } });
    }

    if (products.length === 0) {
      const filters = extractFilters(query);
      products = await Product.find(filters).limit(5);
    }

    if (products.length === 0) {
      products = await Product.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      }).limit(5);
    }

    return products;
  } catch (error) {
    console.error("Error in Pinecone search, falling back to text search:", error.message);
    const filters = extractFilters(query);
    let products = await Product.find(filters).limit(5);
    if (products.length === 0) {
      products = await Product.find({
        $or: [
          { name: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
        ],
      }).limit(5);
    }
    return products;
  }
};

const generateAIResponse = async (query, products) => {
  try {
    const productContext = products
      .map(
        (product) =>
          `Product: ${product.name}\nDescription: ${product.description}\nPrice: ₹${product.price}\nCategory: ${product.category}\nStock: ${product.stock}\nID: ${product._id}`,
      )
      .join("\n\n");

    const systemPrompt = `You are an AI shopping assistant for ShopNest, an e-commerce store.
Answer the user's query using ONLY the provided product context.
If no relevant products are found, say: "Sorry, I couldn't find any matching products. Try browsing our Shop page for all available items."
If products are found, list them with their name, price, and category.
Do NOT invent products, prices, or features not in the context.
Keep responses concise and helpful. Use ₹ for Indian Rupee prices.`;

    const model = genAI.getGenerativeModel({
      model: LLM_MODEL,
      systemInstruction: systemPrompt,
    });

    const result = await model.generateContent(
      `Query: ${query}\n\nAvailable Products:\n${productContext}`,
    );
    const response = await result.response;
    return response.text().trim();
  } catch (error) {
    console.error("Error generating Gemini response:", error.message);
    if (products.length > 0) {
      const list = products
        .map((p) => `• ${p.name} - ₹${p.price}`)
        .join("\n");
      return `Here are some products that might interest you:\n\n${list}`;
    }
    return "Sorry, I'm unable to process your request right now. Please try again.";
  }
};

module.exports = { searchProducts, generateAIResponse };
