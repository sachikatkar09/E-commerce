"use strict";

const mongoose = require("mongoose");
const Product = require("../models/Product.js");
const { generateEmbedding } = require("../services/embeddingService.js");
const { get_namespace } = require("../config/pinecone.js");
require("dotenv").config();

const generateProductEmbeddings = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    const namespace = await get_namespace();

    for (const product of products) {
      const textToEmbed = `${product.name} ${product.description} ${product.category}`;
      const embedding = await generateEmbedding(textToEmbed);

      await namespace.upsert([
        {
          id: product._id.toString(),
          values: embedding,
          metadata: {
            name: product.name,
            description: product.description,
            price: product.price,
            category: product.category,
            stock: product.stock,
            imageUrl: product.imageUrl,
          },
        },
      ]);
      console.log(`Synced to Pinecone: ${product.name}`);
    }

    console.log("All product embeddings synced to Pinecone successfully");
  } catch (error) {
    console.error("Error generating product embeddings:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

generateProductEmbeddings();
