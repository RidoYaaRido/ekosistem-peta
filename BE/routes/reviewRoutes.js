const express = require('express');
const {
  getReviews,
  getReview,
  addReview,
  updateReview,
  deleteReview,
  markHelpful,
  addResponse,
  flagReview,
  moderateReview,
  getPendingModeration
} = require('../controllers/reviewController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.get('/moderate/pending', protect, authorize('admin'), getPendingModeration);

// Public routes
router.get('/', getReviews);
router.get('/:id', getReview);

// Protected routes
router.use(protect);

router.post('/', addReview);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.put('/:id/helpful', markHelpful);
router.put('/:id/response', authorize('mitra', 'admin'), addResponse);
router.put('/:id/flag', flagReview);
router.put('/:id/moderate', authorize('admin'), moderateReview);

module.exports = router;