"use strict";

const mongoose = require("mongoose");
const Product = require("../models/Product.js");
const { generateEmbedding } = require("../services/embeddingService.js");
const { get_namespace } = require("../config/pinecone.js");
require("dotenv").config();

const upsertProductsToPinecone = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const products = await Product.find({});
    console.log(`Found ${products.length} products`);

    const namespace = await get_namespace();

    const BATCH_SIZE = 20;
    for (let i = 0; i < products.length; i += BATCH_SIZE) {
      const batch = products.slice(i, i + BATCH_SIZE);
      const vectors = [];

      for (const product of batch) {
        const textToEmbed = `${product.name} ${product.description} ${product.category}`;
        try {
          const embedding = await generateEmbedding(textToEmbed);
          vectors.push({
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
          });
          console.log(`Embedded: ${product.name}`);
        } catch (err) {
          console.error(`Failed to embed ${product.name}:`, err.message);
        }
      }

      if (vectors.length > 0) {
        await namespace.upsert(vectors);
        console.log(`Upserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${vectors.length} vectors)`);
      }
    }

    console.log("Pinecone sync complete!");
  } catch (error) {
    console.error("Error syncing to Pinecone:", error.message);
  } finally {
    await mongoose.disconnect();
  }
};

upsertProductsToPinecone();
