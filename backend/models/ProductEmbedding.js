"use strict";

const mongoose = require("mongoose");
const { Schema } = mongoose;

const ProductEmbeddingSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: "Product",
    required: true,
    unique: true,
  },
  embedding: {
    type: [Number],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create index for vector search
ProductEmbeddingSchema.index({ embedding: "vector" });

module.exports = mongoose.model("ProductEmbedding", ProductEmbeddingSchema);