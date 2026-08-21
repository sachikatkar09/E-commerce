'use strict';

// Minimal chat controller to prevent backend crashes
// Allows the Shop API to work independently

exports.chat = async (req, res) => {
  try {
    res.status(200).json({
      message: "AI Shopping Assistant is online.",
      products: [] // Placeholder for chatbot product search
    });
  } catch (error) {
    console.error('[chatController] Error:', error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// Placeholder for product search (used by chatbot)
exports.searchProducts = async (query) => {
  return []; // Minimal implementation
};