const mongoose = require('mongoose');
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const productSchema = new mongoose.Schema({
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
  embedding: { type: [Number], default: null }
}, { timestamps: true });

// Helper function to generate embeddings
const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error);
    throw error;
  }
};

productSchema.pre('save', async function(next) {
  const basePrice = Number(this.originalPrice) > 0 ? Number(this.originalPrice) : Number(this.price);
  this.originalPrice = Number(basePrice.toFixed(2));

  if (Number(this.discountPercentage) > 0) {
    this.discountPrice = Number((this.originalPrice * (100 - Number(this.discountPercentage)) / 100).toFixed(2));
  } else {
    this.discountPrice = Number(this.price);
  }

  // Generate embedding for the product
  const textForEmbedding = `${this.name} ${this.description} ${this.category}`;
  try {
    this.embedding = await generateEmbedding(textForEmbedding);
  } catch (error) {
    console.error("Failed to generate embedding for product:", error);
  }

  next();
});

module.exports = mongoose.model('Product', productSchema);
