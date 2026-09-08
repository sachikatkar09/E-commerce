const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getCart, addToCart, removeFromCart, clearCart } = require('../controllers/cartController');
const router = express.Router();

// All cart routes require authentication
router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.delete('/:productId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;