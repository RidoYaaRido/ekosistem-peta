// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// ============================================
// HELPER FUNCTIONS
// ============================================

// Generate JWT Token
const getSignedJwtToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = getSignedJwtToken(user.id);

  // Remove password from response
  delete user.password_hash;

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      points: user.points,
      badge: user.badge,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
      business_name: user.business_name
    }
  });
};

// ============================================
// AUTH CONTROLLERS
// ============================================

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
  const { 
    name, 
    email, 
    password, 
    phone, 
    role,
    address 
  } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return next(new ErrorResponse('Please provide name, email and password', 400));
  }

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorResponse('Please provide a valid email', 400));
  }

  // Validate password length
  if (password.length < 6) {
    return next(new ErrorResponse('Password must be at least 6 characters', 400));
  }

  // Check if user already exists
  const { data: existingUser } = await supabase
    .from('users')
    .select('id')
    .eq('email', email)
    .single();

  if (existingUser) {
    return next(new ErrorResponse('User with this email already exists', 400));
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Prepare user data
  const userData = {
    name,
    email: email.toLowerCase(),
    password_hash,
    phone: phone || null,
    role: role || 'public',
    points: 0,
    badge: 'bronze',
    is_verified: false,
    is_active: true
  };

  // Add address if provided
  if (address) {
    userData.street = address.street || null;
    userData.city = address.city || null;
    userData.province = address.province || null;
    userData.postal_code = address.postal_code || null;
    
    if (address.coordinates && Array.isArray(address.coordinates)) {
      userData.longitude = address.coordinates[0];
      userData.latitude = address.coordinates[1];
    }
  }

  // Create user
  const { data: user, error } = await supabase
    .from('users')
    .insert([userData])
    .select()
    .single();

  if (error) {
    console.error('Registration error:', error);
    return next(new ErrorResponse('Error creating user account', 500));
  }

  sendTokenResponse(user, 201, res);
});

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  // Validate email & password
  if (!email || !password) {
    return next(new ErrorResponse('Please provide email and password', 400));
  }

  // Get user with password
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !user) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Check if account is active
  if (!user.is_active) {
    return next(new ErrorResponse('Your account has been deactivated', 401));
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return next(new ErrorResponse('Invalid credentials', 401));
  }

  // Update last login
  await supabase
    .from('users')
    .update({ last_login: new Date().toISOString() })
    .eq('id', user.id);

  sendTokenResponse(user, 200, res);
});

// @desc    Get current logged in user
// @route   GET /api/v1/auth/me
// @access  Private
exports.getMe = asyncHandler(async (req, res, next) => {
  const user = req.user;

  res.status(200).json({
    success: true,
    data: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      points: user.points,
      badge: user.badge,
      avatar_url: user.avatar_url,
      is_verified: user.is_verified,
      is_active: user.is_active,
      business_name: user.business_name,
      business_license: user.business_license,
      business_type: user.business_type,
      address: {
        street: user.street,
        city: user.city,
        province: user.province,
        postal_code: user.postal_code,
        coordinates: user.latitude && user.longitude 
          ? [user.longitude, user.latitude] 
          : null
      },
      created_at: user.created_at,
      last_login: user.last_login
    }
  });
});

// @desc    Logout user / clear token
// @route   GET /api/v1/auth/logout
// @access  Private
exports.logout = asyncHandler(async (req, res, next) => {
  // Since we're using JWT, we just send success
  // Client should delete the token
  res.status(200).json({
    success: true,
    data: {},
    message: 'User logged out successfully'
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const allowedUpdates = ['name', 'email', 'phone', 'avatar_url'];
  const updates = {};

  // Filter allowed updates
  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

  // If email is being updated, check if it's already taken
  if (updates.email && updates.email !== req.user.email) {
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', updates.email.toLowerCase())
      .single();

    if (existingUser) {
      return next(new ErrorResponse('Email already in use', 400));
    }

    updates.email = updates.email.toLowerCase();
  }

  // Update address if provided
  if (req.body.address) {
    if (req.body.address.street) updates.street = req.body.address.street;
    if (req.body.address.city) updates.city = req.body.address.city;
    if (req.body.address.province) updates.province = req.body.address.province;
    if (req.body.address.postal_code) updates.postal_code = req.body.address.postal_code;
    
    if (req.body.address.coordinates && Array.isArray(req.body.address.coordinates)) {
      updates.longitude = req.body.address.coordinates[0];
      updates.latitude = req.body.address.coordinates[1];
    }
  }

  // Update user
  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) {
    return next(new ErrorResponse('Error updating user details', 500));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update password
// @route   PUT /api/v1/auth/updatepassword
// @access  Private
exports.updatePassword = asyncHandler(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(new ErrorResponse('Please provide current and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(new ErrorResponse('New password must be at least 6 characters', 400));
  }

  // Get user with password
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);

  // Update password
  const { error } = await supabase
    .from('users')
    .update({ password_hash })
    .eq('id', req.user.id);

  if (error) {
    return next(new ErrorResponse('Error updating password', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Password updated successfully'
  });
});

const multer = require('multer');
const path = require('path');

// Configure multer for avatar upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/uploads/avatars/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `avatar-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images only
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  },
  fileFilter: fileFilter
});

// @desc    Upload avatar
// @route   POST /api/v1/auth/upload-avatar
// @access  Private
exports.uploadAvatar = [
  upload.single('avatar'),
  asyncHandler(async (req, res, next) => {
    if (!req.file) {
      return next(new ErrorResponse('Please upload an image file', 400));
    }

    // Construct avatar URL
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    // Update user avatar in database
    const { data: user, error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return next(new ErrorResponse('Error updating avatar', 500));
    }

    // Delete old avatar file if exists
    if (req.user.avatar_url && req.user.avatar_url !== avatarUrl) {
      const oldFilePath = path.join(__dirname, '../public', req.user.avatar_url);
      const fs = require('fs');
      if (fs.existsSync(oldFilePath)) {
        fs.unlinkSync(oldFilePath);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        avatar_url: avatarUrl
      }
    });
  })
];

// @desc    Update business information (Mitra only)
// @route   PUT /api/v1/auth/updatebusiness
// @access  Private (Mitra)
exports.updateBusiness = asyncHandler(async (req, res, next) => {
  // Check if user is mitra
  if (req.user.role !== 'mitra' && req.user.role !== 'admin') {
    return next(new ErrorResponse('Only mitra can update business information', 403));
  }

  const { business_name, business_license, business_type } = req.body;

  const updates = {};
  if (business_name) updates.business_name = business_name;
  if (business_license) updates.business_license = business_license;
  if (business_type) updates.business_type = business_type;

  if (Object.keys(updates).length === 0) {
    return next(new ErrorResponse('Please provide business information to update', 400));
  }

  // Update user
  const { data: user, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', req.user.id)
    .select()
    .single();

  if (error) {
    return next(new ErrorResponse('Error updating business information', 500));
  }

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Get user statistics
// @route   GET /api/v1/auth/stats
// @access  Private
exports.getUserStats = asyncHandler(async (req, res, next) => {
  const userId = req.user.id;

  // Get pickup statistics
  const { data: pickups, error: pickupError } = await supabase
    .from('pickup_requests')
    .select('status, actual_points, actual_total_weight')
    .eq('user_id', userId);

  if (pickupError) {
    return next(new ErrorResponse('Error fetching statistics', 500));
  }

  // Get reviews count
  const { count: reviewsCount, error: reviewError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  // Calculate stats
  const stats = {
    total_pickups: pickups.length,
    completed_pickups: pickups.filter(p => p.status === 'completed').length,
    pending_pickups: pickups.filter(p => p.status === 'pending').length,
    total_weight_collected: pickups
      .filter(p => p.actual_total_weight)
      .reduce((sum, p) => sum + parseFloat(p.actual_total_weight), 0),
    total_points_earned: pickups
      .filter(p => p.actual_points)
      .reduce((sum, p) => sum + p.actual_points, 0),
    total_reviews: reviewsCount || 0,
    current_points: req.user.points,
    badge: req.user.badge,
    member_since: req.user.created_at
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

// @desc    Get user points history
// @route   GET /api/v1/auth/points-history
// @access  Private
exports.getPointsHistory = asyncHandler(async (req, res, next) => {
  const { limit = 20, page = 1 } = req.query;

  const skip = (page - 1) * limit;

  const { data: history, error, count } = await supabase
    .from('points_history')
    .select('*', { count: 'exact' })
    .eq('user_id', req.user.id)
    .order('created_at', { ascending: false })
    .range(skip, skip + limit - 1);

  if (error) {
    return next(new ErrorResponse('Error fetching points history', 500));
  }

  res.status(200).json({
    success: true,
    count: history.length,
    total: count,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    },
    data: history
  });
});

// @desc    Delete account
// @route   DELETE /api/v1/auth/delete-account
// @access  Private
exports.deleteAccount = asyncHandler(async (req, res, next) => {
  const { password } = req.body;

  if (!password) {
    return next(new ErrorResponse('Please provide password to confirm', 400));
  }

  // Get user with password
  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    return next(new ErrorResponse('User not found', 404));
  }

  // Verify password
  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  // Soft delete (deactivate) instead of hard delete
  const { error } = await supabase
    .from('users')
    .update({ 
      is_active: false,
      email: `deleted_${req.user.id}@deleted.com` // Prevent email reuse
    })
    .eq('id', req.user.id);

  if (error) {
    return next(new ErrorResponse('Error deleting account', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Account deleted successfully'
  });
});

module.exports = exports;