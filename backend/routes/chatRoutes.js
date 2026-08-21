const express = require("express");
const router = express.Router();
const { chat } = require("../../controllers/chatController");
const rateLimit = require("express-rate-limit");

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 requests per window
  message: "Too many requests, please try again later."
});

router.post("/chat", limiter, chat);

module.exports = router;