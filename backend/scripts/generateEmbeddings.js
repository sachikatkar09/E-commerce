"use strict";

const mongoose = require("mongoose");
const { OpenAI } = require("openai");
const Product = require("../models/Product.js");
require("dotenv").config();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Generate embeddings for a text
const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || "text-embedding-ada-002",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error("Error generating embedding:", error.message);
    return null;
  }
};

// Generate embeddings for all products
const generateProductEmbeddings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    for (const product of products) {
      const textToEmbed = `${product.name} ${product.description} ${product.category}`;
      const embedding = await generateEmbedding(textToEmbed);

      if (embedding) {
        product.embedding = embedding;
        await product.save();
        console.log(`Updated embedding for product: ${product.name}`);
      }
    }

    console.log("Embeddings generated successfully");
  } catch (error) {
    console.error("Error generating product embeddings:", error.message);
  } finally {
    mongoose.disconnect();
  }
};

// Run the script
generateProductEmbeddings();