// routes/wasteCategoryRoutes.js
const express = require('express');
const {
  getWasteCategories,
  getWasteCategory,
  createWasteCategory,
  updateWasteCategory,
  deleteWasteCategory
} = require('../controllers/wasteCategoryController');

const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// PUBLIC ROUTES
// ============================================

// GET /api/v1/waste-categories - Get all active categories
router.get('/', getWasteCategories);

// GET /api/v1/waste-categories/:id - Get single category
router.get('/:id', getWasteCategory);

// ============================================
// ADMIN ROUTES
// ============================================

// POST /api/v1/waste-categories - Create new category (Admin only)
router.post('/', protect, authorize('admin'), createWasteCategory);

// PUT /api/v1/waste-categories/:id - Update category (Admin only)
router.put('/:id', protect, authorize('admin'), updateWasteCategory);

// DELETE /api/v1/waste-categories/:id - Delete category (Admin only)
router.delete('/:id', protect, authorize('admin'), deleteWasteCategory);

module.exports = router;