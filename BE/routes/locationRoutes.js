// File: routes/locationRoutes.js
const express = require('express');
const router = express.Router();

const {
  getLocations,
  getLocation,
  createLocation,
  updateLocation,
  deleteLocation,
  approveLocation,
  rejectLocation,
  getDashboardLocations,
  getLocationStats
} = require('../controllers/locationController');

const { protect, authorize } = require('../middleware/auth');

// --- 1. TAMBAHKAN BARIS INI ---
// Impor router ulasan
const reviewRouter = require('./reviewRoutes');


// --- Public Routes ---
router.get('/', getLocations); // Peta publik

// --- PERBAIKAN URUTAN ---
router.get('/dashboard', protect, getDashboardLocations);
router.get('/admin/stats', protect, authorize('admin'), getLocationStats);
router.get('/:id', getLocation);


// --- 2. TAMBAHKAN BARIS INI ---
// Pasang (Mount) reviewRouter
// Ini akan mengarahkan rute '/:locationId/reviews' ke reviewRouter
// Rute :locationId akan diteruskan berkat { mergeParams: true } di reviewRoutes.js
router.use('/:locationId/reviews', reviewRouter);


// --- Protected Routes ---
router.use(protect);

router.post('/', authorize('mitra', 'admin'), createLocation);
router.put('/:id', updateLocation);
router.delete('/:id', deleteLocation);


// --- Admin Only Routes ---
router.put('/:id/approve', authorize('admin'), approveLocation);
router.put('/:id/reject', authorize('admin'), rejectLocation);


module.exports = router;