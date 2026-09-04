"use strict";

const express = require("express");
const router = express.Router();
const { chat } = require("../controllers/chatController");
const rateLimit = require("express-rate-limit");

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: "Too many requests, please try again later.",
});

router.post("/", limiter, chat);

module.exports = router;
