// controllers/authController.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { supabase } = require('../config/supabase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

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

// Helper function to send email
const sendEmail = async (options) => {
  try {
    // Create transporter
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    // Send mail
    const info = await transporter.sendMail({
      from: `"Eco-Peta" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: options.email,
      subject: options.subject,
      html: options.html
    });

    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
  res.status(200).json({
    success: true,
    data: {},
    message: 'User logged out successfully'
  });
});

// @desc    Forgot password - Send OTP
// @route   POST /api/v1/auth/forgot-password
// @access  Public
exports.forgotPassword = asyncHandler(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorResponse('Silakan masukkan alamat email', 400));
  }

  // Validate email format
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorResponse('Format email tidak valid', 400));
  }

  // Check if user exists
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, is_active')
    .eq('email', email.toLowerCase())
    .single();

  if (error || !user) {
    return next(new ErrorResponse('Email tidak terdaftar dalam sistem', 404));
  }

  // Check if account is active
  if (!user.is_active) {
    return next(new ErrorResponse('Akun Anda telah dinonaktifkan', 401));
  }

  // Generate 6-digit OTP
  const otp = generateOTP();
  
  // Hash OTP for storage
  const otpHash = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Set expire time (10 minutes)
  const otpExpire = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Update user with OTP
  const { error: updateError } = await supabase
    .from('users')
    .update({
      reset_password_token: otpHash,
      reset_password_expire: otpExpire
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('OTP update error:', updateError);
    return next(new ErrorResponse('Gagal membuat kode OTP', 500));
  }

  // Email message
  const message = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
        .otp-box { background: white; border: 2px dashed #16a34a; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
        .otp-code { font-size: 32px; font-weight: bold; color: #16a34a; letter-spacing: 8px; }
        .warning { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 4px; }
        .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🔐 Reset Password</h1>
          <p>Eco-Peta Platform</p>
        </div>
        <div class="content">
          <p>Halo <strong>${user.name}</strong>,</p>
          <p>Kami menerima permintaan untuk reset password akun Anda. Gunakan kode OTP berikut untuk melanjutkan:</p>
          
          <div class="otp-box">
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px;">Kode OTP Anda:</p>
            <div class="otp-code">${otp}</div>
          </div>

          <div class="warning">
            <strong>⚠️ Penting:</strong>
            <ul style="margin: 10px 0; padding-left: 20px;">
              <li>Kode OTP berlaku selama <strong>10 menit</strong></li>
              <li>Jangan bagikan kode ini kepada siapapun</li>
              <li>Jika Anda tidak meminta reset password, abaikan email ini</li>
            </ul>
          </div>

          <p>Setelah memasukkan kode OTP, Anda dapat membuat password baru untuk akun Anda.</p>
          
          <p>Terima kasih,<br><strong>Tim Eco-Peta</strong></p>
        </div>
        <div class="footer">
          <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
          <p>© 2025 Eco-Peta. All rights reserved.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  try {
    await sendEmail({
      email: user.email,
      subject: 'Kode OTP Reset Password - Eco-Peta',
      html: message
    });

    res.status(200).json({
      success: true,
      message: 'Kode OTP telah dikirim ke email Anda',
      data: {
        email: user.email
      }
    });
  } catch (err) {
    console.error('Email send error:', err);

    // Clear OTP if email fails
    await supabase
      .from('users')
      .update({
        reset_password_token: null,
        reset_password_expire: null
      })
      .eq('id', user.id);

    return next(new ErrorResponse('Gagal mengirim email. Silakan coba lagi', 500));
  }
});

// @desc    Verify OTP
// @route   POST /api/v1/auth/verify-otp
// @access  Public
exports.verifyOTP = asyncHandler(async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(new ErrorResponse('Silakan masukkan email dan kode OTP', 400));
  }

  // Hash the OTP from request
  const otpHash = crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');

  // Find user by email, OTP hash, and check if not expired
  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, reset_password_token, reset_password_expire')
    .eq('email', email.toLowerCase())
    .eq('reset_password_token', otpHash)
    .gt('reset_password_expire', new Date().toISOString())
    .single();

  if (error || !user) {
    return next(new ErrorResponse('Kode OTP tidak valid atau sudah kadaluarsa', 400));
  }

  // Generate temporary token for password reset
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Update user with reset token (valid for 15 minutes)
  const resetTokenExpire = new Date(Date.now() + 15 * 60 * 1000).toISOString();

  const { error: updateError } = await supabase
    .from('users')
    .update({
      reset_password_token: resetTokenHash,
      reset_password_expire: resetTokenExpire
    })
    .eq('id', user.id);

  if (updateError) {
    return next(new ErrorResponse('Gagal memverifikasi OTP', 500));
  }

  res.status(200).json({
    success: true,
    message: 'OTP berhasil diverifikasi',
    data: {
      resetToken,
      email: user.email
    }
  });
});

// @desc    Reset password
// @route   PUT /api/v1/auth/reset-password
// @access  Public
exports.resetPassword = asyncHandler(async (req, res, next) => {
  const { resetToken, password, confirmPassword } = req.body;

  if (!resetToken || !password || !confirmPassword) {
    return next(new ErrorResponse('Silakan lengkapi semua field', 400));
  }

  if (password !== confirmPassword) {
    return next(new ErrorResponse('Password dan konfirmasi password tidak sama', 400));
  }

  if (password.length < 6) {
    return next(new ErrorResponse('Password minimal 6 karakter', 400));
  }

  // Hash the token from request
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Find user by token and check if not expired
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('reset_password_token', resetTokenHash)
    .gt('reset_password_expire', new Date().toISOString())
    .single();

  if (error || !user) {
    return next(new ErrorResponse('Token reset tidak valid atau sudah kadaluarsa', 400));
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Update user password and clear reset token
  const { error: updateError } = await supabase
    .from('users')
    .update({
      password_hash,
      reset_password_token: null,
      reset_password_expire: null
    })
    .eq('id', user.id);

  if (updateError) {
    console.error('Password update error:', updateError);
    return next(new ErrorResponse('Gagal mereset password', 500));
  }

  // Send confirmation email
  try {
    await sendEmail({
      email: user.email,
      subject: 'Password Berhasil Direset - Eco-Peta',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #16a34a 0%, #15803d 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .success-box { background: #d1fae5; border: 2px solid #10b981; border-radius: 8px; padding: 20px; text-align: center; margin: 20px 0; }
            .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Berhasil Direset</h1>
            </div>
            <div class="content">
              <p>Halo <strong>${user.name}</strong>,</p>
              
              <div class="success-box">
                <h2 style="color: #16a34a; margin: 0;">Password Anda telah berhasil direset!</h2>
                <p style="margin: 10px 0 0 0; color: #6b7280;">
                  ${new Date().toLocaleString('id-ID', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>

              <p>Anda sekarang dapat login menggunakan password baru Anda.</p>
              
              <p><strong>⚠️ Jika Anda tidak melakukan perubahan ini, segera hubungi tim support kami.</strong></p>
              
              <p>Terima kasih,<br><strong>Tim Eco-Peta</strong></p>
            </div>
            <div class="footer">
              <p>Email ini dikirim secara otomatis, mohon tidak membalas email ini.</p>
              <p>© 2025 Eco-Peta. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });
  } catch (err) {
    console.error('Confirmation email error:', err);
    // Don't fail the request if confirmation email fails
  }

  res.status(200).json({
    success: true,
    message: 'Password berhasil direset. Silakan login dengan password baru Anda'
  });
});

// @desc    Update user details
// @route   PUT /api/v1/auth/updatedetails
// @access  Private
exports.updateDetails = asyncHandler(async (req, res, next) => {
  const allowedUpdates = ['name', 'email', 'phone', 'avatar_url'];
  const updates = {};

  Object.keys(req.body).forEach(key => {
    if (allowedUpdates.includes(key)) {
      updates[key] = req.body[key];
    }
  });

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

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);

  if (!isMatch) {
    return next(new ErrorResponse('Current password is incorrect', 401));
  }

  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(newPassword, salt);

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
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024
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

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    const { data: user, error } = await supabase
      .from('users')
      .update({ avatar_url: avatarUrl })
      .eq('id', req.user.id)
      .select()
      .single();

    if (error) {
      return next(new ErrorResponse('Error updating avatar', 500));
    }

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

  const { data: pickups, error: pickupError } = await supabase
    .from('pickup_requests')
    .select('status, actual_points, actual_total_weight')
    .eq('user_id', userId);

  if (pickupError) {
    return next(new ErrorResponse('Error fetching statistics', 500));
  }

  const { count: reviewsCount, error: reviewError } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

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

  const { data: user, error: fetchError } = await supabase
    .from('users')
    .select('password_hash')
    .eq('id', req.user.id)
    .single();

  if (fetchError || !user) {
    return next(new ErrorResponse('User not found', 404));
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    return next(new ErrorResponse('Incorrect password', 401));
  }

  const { error } = await supabase
    .from('users')
    .update({ 
      is_active: false,
      email: `deleted_${req.user.id}@deleted.com`
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

// Di BAGIAN PALING BAWAH authController.js
// Pastikan semua function sudah di-export

module.exports = {
  register: exports.register,
  login: exports.login,
  getMe: exports.getMe,
  logout: exports.logout,
  updateDetails: exports.updateDetails,
  updatePassword: exports.updatePassword,
  forgotPassword: exports.forgotPassword,
  verifyOTP: exports.verifyOTP,
  resetPassword: exports.resetPassword,
  uploadAvatar: exports.uploadAvatar,
  updateBusiness: exports.updateBusiness,
  getUserStats: exports.getUserStats,
  getPointsHistory: exports.getPointsHistory,
  deleteAccount: exports.deleteAccount
};