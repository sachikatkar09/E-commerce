const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/authMiddleware');
const { optionalProtect } = require('../middleware/authMiddleware');
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  markReviewHelpful
} = require('../controllers/reviewController');

const upload = multer({ dest: 'uploads/' });
const router = express.Router();

router.get('/product/:productId', optionalProtect, getProductReviews);
router.post('/:productId', protect, upload.array('images', 5), createReview);
router.put('/:reviewId', protect, upload.array('images', 5), updateReview);
router.delete('/:reviewId', protect, deleteReview);
router.post('/:reviewId/helpful', protect, markReviewHelpful);

module.exports = router;
