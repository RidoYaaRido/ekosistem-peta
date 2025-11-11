// controllers/wasteCategoryController.js
const { supabase } = require('../config/supabase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all active waste categories
// @route   GET /api/v1/waste-categories
// @access  Public
exports.getWasteCategories = asyncHandler(async (req, res, next) => {
  // Ambil semua kategori yang statusnya 'is_active' = true
  const { data: categories, error } = await supabase
    .from('waste_categories')
    .select('id, name, description, icon_url, points_per_kg')
    .eq('is_active', true)
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching waste categories:', error);
    return next(new ErrorResponse('Error fetching waste categories', 500));
  }

  res.status(200).json({
    success: true,
    count: categories ? categories.length : 0,
    data: categories || []
  });
});

// @desc    Get single waste category
// @route   GET /api/v1/waste-categories/:id
// @access  Public
exports.getWasteCategory = asyncHandler(async (req, res, next) => {
  const { data: category, error } = await supabase
    .from('waste_categories')
    .select('*')
    .eq('id', req.params.id)
    .eq('is_active', true)
    .single();

  if (error || !category) {
    return next(new ErrorResponse('Waste category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Create waste category
// @route   POST /api/v1/waste-categories
// @access  Private/Admin
exports.createWasteCategory = asyncHandler(async (req, res, next) => {
  const { name, description, icon_url, points_per_kg } = req.body;

  // Validation
  if (!name || !points_per_kg) {
    return next(new ErrorResponse('Please provide name and points_per_kg', 400));
  }

  // Check if category already exists
  const { data: existing } = await supabase
    .from('waste_categories')
    .select('id')
    .eq('name', name)
    .single();

  if (existing) {
    return next(new ErrorResponse('Waste category with this name already exists', 400));
  }

  // Create category
  const { data: category, error } = await supabase
    .from('waste_categories')
    .insert([{
      name,
      description: description || null,
      icon_url: icon_url || null,
      points_per_kg: parseInt(points_per_kg),
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating waste category:', error);
    return next(new ErrorResponse('Error creating waste category', 500));
  }

  res.status(201).json({
    success: true,
    data: category
  });
});

// @desc    Update waste category
// @route   PUT /api/v1/waste-categories/:id
// @access  Private/Admin
exports.updateWasteCategory = asyncHandler(async (req, res, next) => {
  const { name, description, icon_url, points_per_kg, is_active } = req.body;

  // Check if category exists
  const { data: existing } = await supabase
    .from('waste_categories')
    .select('id')
    .eq('id', req.params.id)
    .single();

  if (!existing) {
    return next(new ErrorResponse('Waste category not found', 404));
  }

  // Prepare update data
  const updateData = {};
  if (name) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (icon_url !== undefined) updateData.icon_url = icon_url;
  if (points_per_kg) updateData.points_per_kg = parseInt(points_per_kg);
  if (is_active !== undefined) updateData.is_active = is_active;

  // Update category
  const { data: category, error } = await supabase
    .from('waste_categories')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating waste category:', error);
    return next(new ErrorResponse('Error updating waste category', 500));
  }

  res.status(200).json({
    success: true,
    data: category
  });
});

// @desc    Delete waste category (soft delete)
// @route   DELETE /api/v1/waste-categories/:id
// @access  Private/Admin
exports.deleteWasteCategory = asyncHandler(async (req, res, next) => {
  // Soft delete by setting is_active to false
  const { data: category, error } = await supabase
    .from('waste_categories')
    .update({ is_active: false })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !category) {
    return next(new ErrorResponse('Waste category not found', 404));
  }

  res.status(200).json({
    success: true,
    data: { id: req.params.id, message: 'Waste category deactivated successfully' }
  });
});