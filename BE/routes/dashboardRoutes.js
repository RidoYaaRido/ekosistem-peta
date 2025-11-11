// eco-peta-backend/routes/dashboardRoutes.js
const express = require('express');
const { getMitraOverview } = require('../controllers/dashboardController');

const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');

// @route   GET /api/v1/dashboard/overview
// @desc    Get mitra dashboard overview
// @access  Private (Mitra only)
router.get('/overview', protect, authorize('mitra'), getMitraOverview);

// Log route registration
console.log('✅ Dashboard route registered: GET /api/v1/dashboard/overview');

module.exports = router;