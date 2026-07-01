const { getAIResponse } = require('../services/aiService');

/**
 * POST /api/ai/chat
 * Accepts a user message, queries Gemini with product catalog context,
 * and returns AI reply + matched product objects.
 */
const chat = async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Please provide a valid message' });
    }

    const trimmed = message.trim().slice(0, 500);

    console.log(`[AI Chat] User message: "${trimmed}"`);

    const { reply, products } = await getAIResponse(trimmed);

    console.log(`[AI Chat] Reply length: ${reply.length}, Products found: ${products.length}`);

    res.json({ reply, products });
  } catch (error) {
    console.error('[AI Chat] Error:', error.message);

    // Graceful fallback — never crash the app
    res.status(200).json({
      reply: 'AI Assistant is temporarily unavailable. Please try again later.',
      products: [],
      error: true
    });
  }
};

module.exports = { chat };
