const express = require('express');
const { getCategories } = require('../controllers/productController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.get('/', asyncHandler(getCategories));

module.exports = router;
