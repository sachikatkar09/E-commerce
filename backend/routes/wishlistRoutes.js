const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { getWishlist, addToWishlist, removeFromWishlist, toggleWishlist, isInWishlist } = require('../controllers/wishlistController');
const router = express.Router();

router.get('/', protect, getWishlist);
router.post('/add', protect, addToWishlist);
router.post('/toggle', protect, toggleWishlist);
router.delete('/remove/:productId', protect, removeFromWishlist);
router.get('/check/:productId', protect, isInWishlist);

module.exports = router;