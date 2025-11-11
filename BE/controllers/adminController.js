const { supabase } = require('../config/supabase'); // Impor supabase
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');
const bcrypt = require('bcryptjs');

// @desc    Get dashboard statistics for Admin
// @route   GET /api/v1/admin/stats
// @access  Private (Admin)
// @desc    Create new user (by Admin)
// @route   POST /api/v1/admin/users
// @access  Private (Admin)
exports.createUser = asyncHandler(async (req, res, next) => {
  const { name, email, password, role, is_active } = req.body;

  if (!name || !email || !password || !role) {
    return next(new ErrorResponse('Please provide name, email, password, and role', 400));
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const password_hash = await bcrypt.hash(password, salt);

  // Buat user di tabel 'users'
  const { data: user, error } = await supabase
    .from('users')
    .insert([
      { 
        name, 
        email: email.toLowerCase(), 
        password_hash, 
        role, 
        is_active: is_active ?? true 
      }
    ])
    .select()
    .single();

  if (error) {
    if (error.code === '23505') { // Unique constraint violation (email)
      return next(new ErrorResponse('User with this email already exists', 400));
    }
    return next(new ErrorResponse('Error creating user', 500));
  }
  
  delete user.password_hash;

  res.status(201).json({
    success: true,
    data: user
  });
});

// @desc    Delete user (by Admin)
// @route   DELETE /api/v1/admin/users/:id
// @access  Private (Admin)
exports.deleteUser = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  // Hati-hati: Ini akan menghapus user dari tabel 'users'.
  // Jika Anda perlu menghapus dari 'auth.users' Supabase, itu proses yang berbeda.
  // Kode ini hanya menghapus dari tabel profil 'users'.
  const { data, error } = await supabase
    .from('users')
    .delete()
    .eq('id', id);

  if (error) {
    return next(new ErrorResponse('Error deleting user', 500));
  }
  
  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  });
});

// @desc    Get dashboard statistics for Admin
// @route   GET /api/v1/admin/stats
// @access  Private (Admin)
exports.getDashboardStats = asyncHandler(async (req, res, next) => {
  // Hitung total pengguna
  const { count: totalUsers, error: userError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  // Hitung total mitra
  const { count: totalMitra, error: mitraError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'mitra');
    
  // Hitung pickup selesai bulan ini
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  const { count: totalPickupsThisMonth, error: pickupError } = await supabase
    .from('pickup_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('completed_at', startDate)
    .lte('completed_at', endDate);

  if (userError || mitraError || pickupError) {
    console.error(userError || mitraError || pickupError);
    return next(new ErrorResponse('Error fetching dashboard stats', 500));
  }

  res.status(200).json({
    success: true,
    data: {
      totalUsers,
      totalMitra,
      totalPickupsThisMonth
    }
  });
});



// @desc    Get all users (for Admin)
// @route   GET /api/v1/admin/users
// @access  Private (Admin)

exports.getUsers = asyncHandler(async (req, res, next) => {

  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const startIndex = (page - 1) * limit;

  // Ambil total
  const { count: total, error: countError } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    return next(new ErrorResponse('Error counting users', 500));
  }

  // Ambil data pengguna dengan pagination
  const { data: users, error } = await supabase
    .from('users')
    .select('*') // Anda bisa pilih kolom: 'id, name, email, role, is_active'
    .order('created_at', { ascending: false })
    .range(startIndex, startIndex + limit - 1);
    
  if (error) {
    return next(new ErrorResponse('Error fetching users', 500));
  }
  
  // Hapus password_hash dari setiap user (Best practice)
  const cleanUsers = users.map(user => {
    delete user.password_hash;
    return user;
  });

  // Pagination result
  const pagination = {};
  if ((startIndex + limit) < total) pagination.next = { page: page + 1, limit };
  if (startIndex > 0) pagination.prev = { page: page - 1, limit };

  res.status(200).json({
    success: true,
    count: users.length,
    total,
    pagination,
    data: cleanUsers
  });
});

// @desc    Get single user (for Admin)
// @route   GET /api/v1/admin/users/:id
// @access  Private (Admin)
exports.getUser = asyncHandler(async (req, res, next) => {
  const { data: user, error } = await supabase
    .from('users')
    .select('*') // Pilih kolom yg diperlukan
    .eq('id', req.params.id)
    .single();

  if (error || !user) {
    return next(new ErrorResponse(`User tidak ditemukan dengan ID ${req.params.id}`, 404));
  }

  delete user.password_hash;

  res.status(200).json({
    success: true,
    data: user
  });
});

// @desc    Update user (for Admin)
// @route   PUT /api/v1/admin/users/:id
// @access  Private (Admin)
exports.updateUser = asyncHandler(async (req, res, next) => {
  const { name, role, is_active } = req.body;
  const fieldsToUpdate = {};

  // Hanya tambahkan field yang ada di body
  if (name !== undefined) fieldsToUpdate.name = name;
  if (role !== undefined) fieldsToUpdate.role = role;
  if (is_active !== undefined) fieldsToUpdate.is_active = is_active;
  
  if (Object.keys(fieldsToUpdate).length === 0) {
     return next(new ErrorResponse('Please provide fields to update', 400));
  }
  
  const { data: user, error } = await supabase
    .from('users')
    .update(fieldsToUpdate)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error(error);
    return next(new ErrorResponse(`User tidak ditemukan atau gagal update`, 500));
  }
  
  if (!user) {
     return next(new ErrorResponse(`User tidak ditemukan dengan ID ${req.params.id}`, 404));
  }
  
  delete user.password_hash;

  res.status(200).json({
    success: true,
    data: user
  });
});