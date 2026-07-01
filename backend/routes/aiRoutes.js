const express = require('express');
const { chat } = require('../controllers/aiController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/chat', asyncHandler(chat));

module.exports = router;
