// routes/pickupRoutes.js
const express = require('express');
const {
  getPickups,
  getPickup,
  createPickup,
  updatePickupStatus,
  cancelPickup,
  getMyPickups,
  getMitraSchedule,
  getPickupStats
} = require('../controllers/pickupController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// ============================================
// IMPORTANT: Route order matters!
// Specific routes MUST come before parameterized routes
// ============================================

// All routes below require authentication
router.use(protect);

// ============================================
// SPECIFIC ROUTES (must be first)
// ============================================

// GET /api/v1/pickups/my-pickups - Get user's own pickup requests
router.get('/my-pickups', authorize('public'), getMyPickups);

// GET /api/v1/pickups/schedule - Get mitra's pickup schedule (Mitra/Admin only)
router.get('/schedule', authorize('mitra', 'admin'), getMitraSchedule);

// GET /api/v1/pickups/stats - Get pickup statistics
router.get('/stats', getPickupStats);

// ============================================
// GENERAL ROUTES
// ============================================

// GET /api/v1/pickups - Get all pickups (filtered by role)
router.get('/', getPickups);

// POST /api/v1/pickups - Create new pickup request
router.post('/', createPickup);

// ============================================
// PARAMETERIZED ROUTES (must be last)
// ============================================

// GET /api/v1/pickups/:id - Get single pickup request
router.get('/:id', getPickup);

// PUT /api/v1/pickups/:id/status - Update pickup status (Mitra/Admin only)
router.put('/:id/status', authorize('mitra', 'admin'), updatePickupStatus);

// PUT /api/v1/pickups/:id/cancel - Cancel pickup request (User only)
router.put('/:id/cancel', cancelPickup);

module.exports = router;