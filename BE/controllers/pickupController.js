// controllers/pickupController.js
const { supabase } = require('../config/supabase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// Helper: Send notification to user/mitra
const sendPickupNotification = async (userId, title, message, pickupId) => {
  try {
    await supabase.from('notifications').insert([{
      user_id: userId,
      title,
      message,
      type: 'pickup',
      related_id: pickupId
    }]);
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Helper: Award points to user
const awardPointsToUser = async (userId, points, pickupId) => {
  try {
    // 1. Get current user points
    const { data: user, error: getUserError } = await supabase
      .from('users')
      .select('points')
      .eq('id', userId)
      .single();

    if (getUserError) throw getUserError;

    const newPoints = (user.points || 0) + points;

    // 2. Update user points
    const { error: updateError } = await supabase
      .from('users')
      .update({ points: newPoints })
      .eq('id', userId);

    if (updateError) throw updateError;

    // 3. Create points history record
    await supabase.from('points_history').insert([{
      user_id: userId,
      points: points,
      type: 'earned',
      source: 'pickup',
      source_id: pickupId,
      description: `Penjemputan sampah selesai`
    }]);

    console.log(`✅ Awarded ${points} points to user ${userId}`);
    return true;
  } catch (error) {
    console.error('Error awarding points:', error);
    return false;
  }
};

// @desc    Get all pickup requests (with filters)
// @route   GET /api/v1/pickups
// @access  Private
exports.getPickups = asyncHandler(async (req, res, next) => {
  const { status, date, location_id } = req.query;

  let query = supabase
    .from('pickup_requests')
    .select(`
      *,
      user:users!pickup_requests_user_id_fkey(id, name, phone),
      location:locations!pickup_requests_location_id_fkey(id, name, type, phone),
      waste_items:pickup_waste_items(
        *,
        category:waste_categories(id, name, icon_url, points_per_kg)
      )
    `)
    .order('created_at', { ascending: false });

  // Filter by user role
  if (req.user.role === 'public') {
    query = query.eq('user_id', req.user.id);
  } else if (req.user.role === 'mitra') {
    const { data: myLocations } = await supabase
      .from('locations')
      .select('id')
      .eq('owner_id', req.user.id);
    
    if (myLocations && myLocations.length > 0) {
      const locationIds = myLocations.map(l => l.id);
      query = query.in('location_id', locationIds);
    } else {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }
  }

  // Apply filters
  if (status) {
    const statusArray = status.split(',');
    query = query.in('status', statusArray);
  }

  if (date) {
    query = query.eq('scheduled_date', date);
  }

  if (location_id) {
    query = query.eq('location_id', location_id);
  }

  const { data: pickups, error } = await query;

  if (error) {
    console.error('Error fetching pickups:', error);
    return next(new ErrorResponse('Error fetching pickup requests', 500));
  }

  res.status(200).json({
    success: true,
    count: pickups.length,
    data: pickups
  });
});

// @desc    Get single pickup request
// @route   GET /api/v1/pickups/:id
// @access  Private
exports.getPickup = asyncHandler(async (req, res, next) => {
  const { data: pickup, error } = await supabase
    .from('pickup_requests')
    .select(`
      *,
      user:users!pickup_requests_user_id_fkey(id, name, phone, email),
      location:locations!pickup_requests_location_id_fkey(id, name, type, phone, street, city),
      waste_items:pickup_waste_items(
        *,
        category:waste_categories(id, name, icon_url, points_per_kg)
      )
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !pickup) {
    return next(new ErrorResponse('Pickup request not found', 404));
  }

  // Check authorization
  const { data: location } = await supabase
    .from('locations')
    .select('owner_id')
    .eq('id', pickup.location_id)
    .single();

  if (
    pickup.user_id !== req.user.id &&
    location?.owner_id !== req.user.id &&
    req.user.role !== 'admin'
  ) {
    return next(new ErrorResponse('Not authorized to view this pickup', 403));
  }

  res.status(200).json({
    success: true,
    data: pickup
  });
});

// @desc    Create pickup request
// @route   POST /api/v1/pickups
// @access  Private
exports.createPickup = asyncHandler(async (req, res, next) => {
  const {
    location_id,
    waste_items,
    pickup_address,
    scheduled_date,
    time_slot,
    user_notes
  } = req.body;

  // Validate required fields
  if (!location_id || !waste_items || !pickup_address || !scheduled_date || !time_slot) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  if (!Array.isArray(waste_items) || waste_items.length === 0) {
    return next(new ErrorResponse('At least one waste item is required', 400));
  }

  if (!pickup_address.street || !pickup_address.city) {
    return next(new ErrorResponse('Pickup address must include street and city', 400));
  }

  // Validate scheduled date (must be tomorrow or later)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const scheduledDate = new Date(scheduled_date);
  scheduledDate.setHours(0, 0, 0, 0);
  
  if (scheduledDate <= today) {
    return next(new ErrorResponse('Scheduled date must be at least tomorrow', 400));
  }

  // Validate location exists and accepts pickups
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('*, owner:users!locations_owner_id_fkey(id, name, email)')
    .eq('id', location_id)
    .eq('status', 'approved')
    .single();

  if (locationError || !location) {
    return next(new ErrorResponse('Location not found or not available', 404));
  }

  if (!location.pickup_service) {
    return next(new ErrorResponse('This location does not offer pickup service', 400));
  }

  // Calculate estimated points
  let estimatedPoints = 0;
  let estimatedTotalWeight = 0;

  const categoryIds = waste_items.map(item => item.category_id);
  const { data: categories, error: catError } = await supabase
    .from('waste_categories')
    .select('id, points_per_kg')
    .in('id', categoryIds)
    .eq('is_active', true);

  if (catError || !categories || categories.length === 0) {
    return next(new ErrorResponse('Invalid waste category selection', 400));
  }

  const categoryMap = Object.fromEntries(categories.map(c => [c.id, c.points_per_kg]));

  for (const item of waste_items) {
    if (!item.category_id || item.estimated_weight <= 0) {
      return next(new ErrorResponse('All waste items must have valid category and weight > 0', 400));
    }

    const pointsPerKg = categoryMap[item.category_id];
    if (!pointsPerKg) {
      return next(new ErrorResponse(`Invalid category: ${item.category_id}`, 400));
    }

    estimatedPoints += item.estimated_weight * pointsPerKg;
    estimatedTotalWeight += parseFloat(item.estimated_weight);
  }

  // Create pickup request
  const { data: pickup, error } = await supabase
    .from('pickup_requests')
    .insert([
      {
        user_id: req.user.id,
        location_id,
        status: 'pending',
        scheduled_date,
        time_slot,
        pickup_street: pickup_address.street,
        pickup_city: pickup_address.city,
        pickup_province: pickup_address.province || null,
        pickup_latitude: pickup_address.latitude || null,
        pickup_longitude: pickup_address.longitude || null,
        pickup_notes: pickup_address.notes || null,
        estimated_total_weight: estimatedTotalWeight,
        estimated_points: Math.round(estimatedPoints),
        user_notes,
        points_awarded: false
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating pickup:', error);
    return next(new ErrorResponse('Error creating pickup request', 500));
  }

  // Insert waste items
  const wasteItemsData = waste_items.map(item => ({
    pickup_id: pickup.id,
    category_id: item.category_id,
    estimated_weight: item.estimated_weight,
    unit: item.unit || 'kg'
  }));

  const { error: itemsError } = await supabase
    .from('pickup_waste_items')
    .insert(wasteItemsData);

  if (itemsError) {
    console.error('Error creating waste items:', itemsError);
    await supabase.from('pickup_requests').delete().eq('id', pickup.id);
    return next(new ErrorResponse('Error creating pickup request', 500));
  }

  // Send notification to mitra
  if (location.owner && location.owner.id) {
    await sendPickupNotification(
      location.owner.id,
      '📦 Permintaan Penjemputan Baru',
      `Permintaan penjemputan baru dari ${req.user.name} pada ${new Date(scheduled_date).toLocaleDateString('id-ID')}`,
      pickup.id
    );
  }

  // Send confirmation to user
  await sendPickupNotification(
    req.user.id,
    '✅ Permintaan Penjemputan Dibuat',
    `Permintaan penjemputan Anda telah dibuat dan menunggu konfirmasi dari ${location.name}`,
    pickup.id
  );

  res.status(201).json({
    success: true,
    message: 'Pickup request created successfully',
    data: pickup
  });
});

// @desc    Update pickup status
// @route   PUT /api/v1/pickups/:id/status
// @access  Private (Mitra/Admin)
exports.updatePickupStatus = asyncHandler(async (req, res, next) => {
  const { status, actual_weight_items, driver_notes, photos } = req.body;

  // Get pickup
  const { data: pickup, error: fetchError } = await supabase
    .from('pickup_requests')
    .select('*, location:locations!pickup_requests_location_id_fkey(owner_id)')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !pickup) {
    return next(new ErrorResponse('Pickup request not found', 404));
  }

  // Check authorization
  if (pickup.location.owner_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to update this pickup', 403));
  }

  // Validate status transition
  const validTransitions = {
    pending: ['accepted', 'cancelled'],
    accepted: ['scheduled', 'cancelled'],
    scheduled: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: []
  };

  if (!validTransitions[pickup.status] || !validTransitions[pickup.status].includes(status)) {
    return next(new ErrorResponse(`Cannot change status from ${pickup.status} to ${status}`, 400));
  }

  const updateData = {
    status,
    driver_notes
  };

  // If completing pickup - AWARD POINTS HERE
  if (status === 'completed') {
    if (!actual_weight_items || actual_weight_items.length === 0) {
      return next(new ErrorResponse('Please provide actual weight for completion', 400));
    }

    let actualTotalWeight = 0;
    let actualPoints = 0;

    // Update actual weights
    for (const item of actual_weight_items) {
      const { data: category } = await supabase
        .from('waste_categories')
        .select('points_per_kg')
        .eq('id', item.category_id)
        .single();

      actualTotalWeight += parseFloat(item.actual_weight);
      if (category) {
        actualPoints += item.actual_weight * category.points_per_kg;
      }

      await supabase
        .from('pickup_waste_items')
        .update({ actual_weight: item.actual_weight })
        .eq('pickup_id', req.params.id)
        .eq('category_id', item.category_id);
    }

    updateData.actual_total_weight = actualTotalWeight;
    updateData.actual_points = Math.round(actualPoints);
    updateData.completed_at = new Date().toISOString();
    updateData.after_photos = photos || [];
    updateData.points_awarded = true; // Mark as awarded

    // 🎯 AWARD POINTS TO USER
    await awardPointsToUser(pickup.user_id, Math.round(actualPoints), pickup.id);
  }

  if (status === 'cancelled') {
    updateData.cancelled_at = new Date().toISOString();
    updateData.cancellation_reason = driver_notes;
  }

  // Update pickup
  const { data: updatedPickup, error } = await supabase
    .from('pickup_requests')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error('Error updating pickup:', error);
    return next(new ErrorResponse('Error updating pickup status', 500));
  }

  // Send notification to user
  let notificationMessage = `Status penjemputan Anda telah diubah menjadi: ${status}`;
  if (status === 'completed') {
    notificationMessage = `✅ Penjemputan selesai! Anda mendapatkan ${Math.round(updateData.actual_points)} poin`;
  }

  await sendPickupNotification(
    pickup.user_id,
    'Status Penjemputan Diupdate',
    notificationMessage,
    pickup.id
  );

  res.status(200).json({
    success: true,
    data: updatedPickup
  });
});

// @desc    Cancel pickup request
// @route   PUT /api/v1/pickups/:id/cancel
// @access  Private (Owner)
exports.cancelPickup = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  const { data: pickup, error: fetchError } = await supabase
    .from('pickup_requests')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !pickup) {
    return next(new ErrorResponse('Pickup request not found', 404));
  }

  if (pickup.user_id !== req.user.id) {
    return next(new ErrorResponse('Not authorized to cancel this pickup', 403));
  }

  if (!['pending', 'accepted', 'scheduled'].includes(pickup.status)) {
    return next(new ErrorResponse('Cannot cancel pickup at this stage', 400));
  }

  const { data: updatedPickup, error } = await supabase
    .from('pickup_requests')
    .update({
      status: 'cancelled',
      cancelled_at: new Date().toISOString(),
      cancellation_reason: reason || 'Cancelled by user'
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error('Error cancelling pickup:', error);
    return next(new ErrorResponse('Error cancelling pickup', 500));
  }

  res.status(200).json({
    success: true,
    data: updatedPickup
  });
});

// controllers/pickupController.js - ADD THIS METHOD

// @desc    Get current user's pickup requests
// @route   GET /api/v1/pickups/my-pickups
// @access  Private (Public role)
exports.getMyPickups = asyncHandler(async (req, res, next) => {
  const { status, limit = 100, page = 1 } = req.query;

  let query = supabase
    .from('pickup_requests')
    .select(`
      *,
      user:users!pickup_requests_user_id_fkey(id, name, phone, email),
      location:locations!pickup_requests_location_id_fkey(
        id, 
        name, 
        type,
        street,
        city,
        province,
        phone,
        owner:users!locations_owner_id_fkey(id, name, phone)
      )
    `, { count: 'exact' })
    .eq('user_id', req.user.id) // Filter by current user
    .order('created_at', { ascending: false });

  // Filter by status if provided
  if (status && status !== 'all') {
    query = query.eq('status', status);
  }

  // Pagination
  const skip = (page - 1) * limit;
  query = query.range(skip, skip + limit - 1);

  const { data: pickups, error, count } = await query;

  if (error) {
    console.error('Error fetching my pickups:', error);
    return next(new ErrorResponse('Error fetching pickup requests', 500));
  }

  res.status(200).json({
    success: true,
    count: pickups?.length || 0,
    total: count || 0,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil((count || 0) / limit)
    },
    data: pickups || []
  });
});

// @desc    Get mitra pickup schedule
// @route   GET /api/v1/pickups/schedule
// @access  Private (Mitra)
exports.getMitraSchedule = asyncHandler(async (req, res, next) => {
  const { date, status = 'pending,accepted,scheduled,in_progress' } = req.query;

  const { data: locations } = await supabase
    .from('locations')
    .select('id')
    .eq('owner_id', req.user.id);

  if (!locations || locations.length === 0) {
    return res.status(200).json({
      success: true,
      count: 0,
      data: []
    });
  }

  const locationIds = locations.map(l => l.id);
  const statusArray = status.split(',');

  let query = supabase
    .from('pickup_requests')
    .select(`
      *,
      user:users!pickup_requests_user_id_fkey(id, name, phone),
      location:locations!pickup_requests_location_id_fkey(id, name, phone),
      waste_items:pickup_waste_items(
        *,
        category:waste_categories(id, name)
      )
    `)
    .in('location_id', locationIds)
    .in('status', statusArray)
    .order('scheduled_date', { ascending: true })
    .order('time_slot', { ascending: true });

  if (date) {
    query = query.eq('scheduled_date', date);
  }

  const { data: pickups, error } = await query;

  if (error) {
    console.error('Error fetching schedule:', error);
    return next(new ErrorResponse('Error fetching schedule', 500));
  }

  res.status(200).json({
    success: true,
    count: pickups.length,
    data: pickups
  });
});

// @desc    Get pickup statistics
// @route   GET /api/v1/pickups/stats
// @access  Private
exports.getPickupStats = asyncHandler(async (req, res, next) => {
  let query;

  if (req.user.role === 'admin') {
    query = supabase.from('pickup_requests').select('*');
  } else if (req.user.role === 'mitra') {
    const { data: locations } = await supabase
      .from('locations')
      .select('id')
      .eq('owner_id', req.user.id);
    
    if (!locations || locations.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          total: 0,
          pending: 0,
          accepted: 0,
          scheduled: 0,
          in_progress: 0,
          completed: 0,
          cancelled: 0,
          total_weight: 0,
          total_points_earned: 0
        }
      });
    }

    const locationIds = locations.map(l => l.id);
    query = supabase
      .from('pickup_requests')
      .select('*')
      .in('location_id', locationIds);
  } else {
    query = supabase
      .from('pickup_requests')
      .select('*')
      .eq('user_id', req.user.id);
  }

  const { data: pickups, error } = await query;

  if (error) {
    console.error('Error fetching stats:', error);
    return next(new ErrorResponse('Error fetching statistics', 500));
  }

  const stats = {
    total: pickups.length,
    pending: pickups.filter(p => p.status === 'pending').length,
    accepted: pickups.filter(p => p.status === 'accepted').length,
    scheduled: pickups.filter(p => p.status === 'scheduled').length,
    in_progress: pickups.filter(p => p.status === 'in_progress').length,
    completed: pickups.filter(p => p.status === 'completed').length,
    cancelled: pickups.filter(p => p.status === 'cancelled').length,
    total_weight: pickups
      .filter(p => p.actual_total_weight)
      .reduce((sum, p) => sum + parseFloat(p.actual_total_weight), 0),
    total_points_earned: pickups
      .filter(p => p.actual_points && p.points_awarded)
      .reduce((sum, p) => sum + p.actual_points, 0)
  };

  res.status(200).json({
    success: true,
    data: stats
  });
});

module.exports = exports;