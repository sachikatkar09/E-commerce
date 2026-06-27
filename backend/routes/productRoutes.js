const express = require('express');
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require('../controllers/productController');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const multer = require('multer');
const asyncHandler = require('../utils/asyncHandler');
const upload = multer({ dest: 'uploads/' });

const router = express.Router();

router.route('/').get(asyncHandler(getProducts)).post(protect, admin, upload.single('image'), asyncHandler(createProduct));
router.route('/:id').get(asyncHandler(getProductById)).put(protect, admin, upload.single('image'), asyncHandler(updateProduct)).delete(protect, admin, asyncHandler(deleteProduct));

module.exports = router;
