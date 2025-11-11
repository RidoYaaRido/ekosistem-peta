const express = require('express');
const {
  register,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword,
  updateBusiness,
  forgotPassword,
  verifyOTP,
  resetPassword,
  uploadAvatar
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.put('/reset-password', resetPassword);

// Protected routes
router.get('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/updatedetails', protect, updateDetails);
router.put('/updatepassword', protect, updatePassword);
router.put('/updatebusiness', protect, updateBusiness);
router.post('/upload-avatar', protect, uploadAvatar);

module.exports = router;