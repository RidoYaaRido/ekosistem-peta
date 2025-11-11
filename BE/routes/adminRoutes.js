
const express = require('express');
const router = express.Router();

// Impor controller
const {
  getDashboardStats,
  getUsers,
  getUser,
  updateUser,
  createUser,  // <-- Impor baru
  deleteUser   // <-- Impor baru
} = require('../controllers/adminController');




// Impor middleware otentikasi
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.use(authorize('admin'));

// Rute
router.route('/stats').get(getDashboardStats);


router.route('/users')
  .get(getUsers)
  .post(createUser); // <-- Tambahkan POST

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser); // <-- Tambahkan DELETE

module.exports = router;