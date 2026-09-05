'use strict';

const { searchProducts, generateAIResponse, isGreeting } = require('../services/ragService');

exports.chat = async (req, res) => {
  try {
    const { message: rawMessage, conversationHistory } = req.body;

    if (!rawMessage || !rawMessage.trim()) {
      return res.status(400).json({
        success: false,
        message: "Query is required.",
        products: [],
      });
    }

    const query = rawMessage.trim();
    console.log(`[Chat] Received: "${query}"`);

    let products = [];
    try {
      products = await searchProducts(query, conversationHistory);
    } catch (searchErr) {
      console.error("[Chat] searchProducts threw:", searchErr.message);
      products = [];
    }

    console.log(`[Chat] Products found: ${products.length}`);

    let aiResponse;
    try {
      aiResponse = await generateAIResponse(query, products, conversationHistory);
    } catch (llmErr) {
      console.error("[Chat] generateAIResponse threw:", llmErr.message);
      if (products.length > 0) {
        aiResponse = products.map(p => `• ${p.name} - ₹${p.price}`).join("\n");
      } else {
        aiResponse = "Sorry, I'm having trouble generating a response. Please try again.";
      }
    }

    const responsePayload = {
      success: true,
      message: aiResponse,
      products: [],
    };

    if (!isGreeting(query) && products.length > 0) {
      responsePayload.products = products.map(product => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.category,
        stock: product.stock,
        ratings: product.ratings || 0,
      }));
    }

    console.log(`[Chat] Response: ${responsePayload.message.substring(0, 80)}... | Products: ${responsePayload.products.length}`);
    return res.status(200).json(responsePayload);
  } catch (error) {
    console.error('[Chat] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      message: "Sorry, I'm unable to process your request right now. Please try again.",
      products: [],
    });
  }
};
