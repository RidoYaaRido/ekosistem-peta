// controllers/reviewController.js
const { supabase } = require('../config/supabase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');


// @desc    Get all reviews
// @route   GET /api/v1/locations/:locationId/reviews (untuk halaman detail lokasi)
// @route   GET /api/v1/reviews (untuk dashboard)
// @access  Public
exports.getReviews = asyncHandler(async (req, res, next) => {
  const { locationId } = req.params;
  const { sort = '-created_at', status = 'active', limit = 10, page = 1 } = req.query;

  let query = supabase
    .from('reviews')
    .select(`
      *,
      user:users!reviews_user_id_fkey(id, name, avatar_url, badge),
      location:locations!reviews_location_id_fkey(id, name, type),
      pickup:pickup_requests!reviews_pickup_id_fkey(id, scheduled_date, status)
    `, { count: 'exact' });

  // --- PERBAIKAN LOGIKA FILTER ---

  // 1. Filter berdasarkan locationId JIKA ADA (untuk halaman detail publik)
  if (locationId) {
    query = query.eq('location_id', locationId);
  }

  // 2. Filter berdasarkan PERAN PENGGUNA (jika tidak ada locationId / di dashboard)
  if (!locationId && req.user) {
    if (req.user.role === 'public') {
      // Pengguna PUBLIC: Hanya lihat ulasan milik sendiri
      query = query.eq('user_id', req.user.id);
      
    } else if (req.user.role === 'mitra') {
      // MITRA: Hanya lihat ulasan untuk lokasi milik mereka
      const { data: myLocations, error: locError } = await supabase
        .from('locations')
        .select('id')
        .eq('owner_id', req.user.id);
      
      if (locError) {
        console.error('Error fetching mitra locations for review filter:', locError);
        return next(new ErrorResponse('Error fetching locations', 500));
      }

      if (myLocations && myLocations.length > 0) {
        const locationIds = myLocations.map(l => l.id);
        query = query.in('location_id', locationIds);
      } else {
        // Mitra ini tidak punya lokasi, kembalikan array kosong
        return res.status(200).json({ success: true, count: 0, total: 0, data: [] });
      }
    }
    // 3. ADMIN: (Tidak ada filter, bisa lihat semua)
  }
  
  // 3. Filter berdasarkan STATUS
  if (req.user?.role === 'admin') {
    // Admin bisa filter semua status
    if (status && status !== 'all') {
      query = query.eq('status', status);
    }
  } else if (req.user?.role === 'public' || req.user?.role === 'mitra') {
     // Public & Mitra tidak bisa filter status 'hidden'
     if (status && status !== 'all') {
        query = query.eq('status', status);
     } else if (!locationId) {
        // Jika di halaman dashboard (bukan halaman lokasi), jangan tampilkan yg 'hidden'
        query = query.not('status', 'eq', 'hidden');
     } else {
        // Jika di halaman lokasi publik, HANYA tampilkan 'active'
        query = query.eq('status', 'active');
     }
  } else {
    // Pengguna anonim (tidak login) HANYA bisa lihat 'active'
    query = query.eq('status', 'active');
  }
  
  // --- AKHIR PERBAIKAN LOGIKA FILTER ---

  // Sorting options
  let sortField, sortOrder;
  
  if (sort === 'recent' || sort === '-created_at') {
    sortField = 'created_at';
    sortOrder = 'desc';
  } else if (sort === 'rating' || sort === '-rating') {
    sortField = 'rating';
    sortOrder = 'desc';
  } else if (sort === 'helpful' || sort === '-helpful_count') {
    sortField = 'helpful_count';
    sortOrder = 'desc';
  } else {
    sortField = sort.startsWith('-') ? sort.substring(1) : sort;
    sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
  }
  
  query = query.order(sortField, { ascending: sortOrder === 'asc' });

  // Pagination
  const skip = (page - 1) * limit;
  query = query.range(skip, skip + limit - 1);

  const { data: reviews, error, count } = await query;

  if (error) {
    console.error('Error fetching reviews:', error);
    return next(new ErrorResponse('Error fetching reviews', 500));
  }

  // Add helpful status for current user
  if (req.user && reviews && reviews.length > 0) {
    const reviewIds = reviews.map(r => r.id);
    const { data: helpfulData } = await supabase
      .from('review_helpful')
      .select('review_id')
      .eq('user_id', req.user.id)
      .in('review_id', reviewIds);
    
    const helpfulReviewIds = helpfulData?.map(h => h.review_id) || [];
    
    reviews.forEach(review => {
      review.is_helpful_by_me = helpfulReviewIds.includes(review.id);
    });
  }

  res.status(200).json({
    success: true,
    count: reviews ? reviews.length : 0,
    total: count || 0,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil((count || 0) / limit)
    },
    data: reviews || []
  });
});

// @desc    Get single review
// @route   GET /api/v1/reviews/:id
// @access  Public
exports.getReview = asyncHandler(async (req, res, next) => {
  const { data: review, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:users!reviews_user_id_fkey(id, name, avatar_url, badge),
      location:locations!reviews_location_id_fkey(id, name, type, owner_id),
      pickup:pickup_requests!reviews_pickup_id_fkey(id, scheduled_date, status)
    `)
    .eq('id', req.params.id)
    .single();

  if (error || !review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // Check if current user marked this as helpful
  if (req.user) {
    const { data: helpful } = await supabase
      .from('review_helpful')
      .select('id')
      .eq('review_id', review.id)
      .eq('user_id', req.user.id)
      .single();
    
    review.is_helpful_by_me = !!helpful;
  }

  res.status(200).json({
    success: true,
    data: review
  });
});

// @desc    Add review
// @route   POST /api/v1/locations/:locationId/reviews
// @access  Private (Public role only)
exports.addReview = asyncHandler(async (req, res, next) => {
  const { locationId } = req.params;
  const { rating, title, comment, photos, pickup_id } = req.body;

  // RULE 1: Only 'public' role can create reviews
  if (req.user.role !== 'public') {
    return next(new ErrorResponse('Only public users can create reviews', 403));
  }

  // Validate required fields
  if (!rating || !comment) {
    return next(new ErrorResponse('Please provide rating and comment', 400));
  }

  if (rating < 1 || rating > 5) {
    return next(new ErrorResponse('Rating must be between 1 and 5', 400));
  }

  if (comment.length < 10) {
    return next(new ErrorResponse('Comment must be at least 10 characters', 400));
  }

  // Check if location exists and is approved
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .select('id, status, owner_id')
    .eq('id', locationId)
    .single();

  if (locationError || !location) {
    return next(new ErrorResponse('Location not found', 404));
  }

  if (location.status !== 'approved') {
    return next(new ErrorResponse('Cannot review unapproved location', 400));
  }

  // RULE 2: User cannot review their own location
  if (location.owner_id === req.user.id) {
    return next(new ErrorResponse('You cannot review your own location', 400));
  }

  // RULE 3: If pickup_id provided, validate pickup
  if (pickup_id) {
    const { data: pickup, error: pickupError } = await supabase
      .from('pickup_requests')
      .select('user_id, location_id, status')
      .eq('id', pickup_id)
      .single();

    if (pickupError || !pickup) {
      return next(new ErrorResponse('Pickup not found', 404));
    }

    // Verify pickup belongs to user
    if (pickup.user_id !== req.user.id) {
      return next(new ErrorResponse('Not authorized to review this pickup', 403));
    }

    // Verify pickup is for this location
    if (pickup.location_id !== locationId) {
      return next(new ErrorResponse('Pickup does not belong to this location', 400));
    }

    // RULE 4: Can only review completed pickups
    if (pickup.status !== 'completed') {
      return next(new ErrorResponse('Can only review completed pickups', 400));
    }

    // RULE 5: Check if user already reviewed this pickup (unique constraint)
    const { data: existingReview } = await supabase
      .from('reviews')
      .select('id')
      .eq('location_id', locationId)
      .eq('user_id', req.user.id)
      .eq('pickup_id', pickup_id)
      .single();

    if (existingReview) {
      return next(new ErrorResponse('You have already reviewed this pickup', 400));
    }
  }

  // Create review
  const { data: review, error } = await supabase
    .from('reviews')
    .insert([
      {
        location_id: locationId,
        user_id: req.user.id,
        pickup_id: pickup_id || null,
        rating,
        title: title || null,
        comment,
        photos: photos || [],
        status: 'active',
        helpful_count: 0,
        flagged_count: 0
      }
    ])
    .select(`
      *,
      user:users!reviews_user_id_fkey(id, name, avatar_url, badge)
    `)
    .single();

  if (error) {
    console.error('Error creating review:', error);
    return next(new ErrorResponse('Error creating review', 500));
  }

  // Rating will be updated automatically by database trigger

  res.status(201).json({
    success: true,
    data: review
  });
});

// @desc    Update review
// @route   PUT /api/v1/reviews/:id
// @access  Private (Owner only)
exports.updateReview = asyncHandler(async (req, res, next) => {
  const { rating, title, comment, photos } = req.body;

  // Get review
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // RULE 6: Only owner can update their review
  if (review.user_id !== req.user.id) {
    return next(new ErrorResponse('Not authorized to update this review', 403));
  }

  // RULE 7: Can't edit if review is flagged or hidden
  if (review.status !== 'active') {
    return next(new ErrorResponse('Cannot edit flagged or hidden reviews', 400));
  }

  // Validate
  if (rating && (rating < 1 || rating > 5)) {
    return next(new ErrorResponse('Rating must be between 1 and 5', 400));
  }

  if (comment && comment.length < 10) {
    return next(new ErrorResponse('Comment must be at least 10 characters', 400));
  }

  // Update review
  const updateData = {};
  if (rating !== undefined) updateData.rating = rating;
  if (title !== undefined) updateData.title = title;
  if (comment !== undefined) updateData.comment = comment;
  if (photos !== undefined) updateData.photos = photos;

  const { data: updatedReview, error } = await supabase
    .from('reviews')
    .update(updateData)
    .eq('id', req.params.id)
    .select(`
      *,
      user:users!reviews_user_id_fkey(id, name, avatar_url)
    `)
    .single();

  if (error) {
    console.error('Error updating review:', error);
    return next(new ErrorResponse('Error updating review', 500));
  }

  res.status(200).json({
    success: true,
    data: updatedReview
  });
});

// @desc    Delete review
// @route   DELETE /api/v1/reviews/:id
// @access  Private (Owner/Admin)
exports.deleteReview = asyncHandler(async (req, res, next) => {
  // Get review
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // RULE 8: Only owner or admin can delete
  if (review.user_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this review', 403));
  }

  // Delete review
  const { error } = await supabase
    .from('reviews')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    console.error('Error deleting review:', error);
    return next(new ErrorResponse('Error deleting review', 500));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Mark review as helpful
// @route   PUT /api/v1/reviews/:id/helpful
// @access  Private
exports.markHelpful = asyncHandler(async (req, res, next) => {
  // Get review
  const { data: review, error: reviewError } = await supabase
    .from('reviews')
    .select('id, user_id, status')
    .eq('id', req.params.id)
    .single();

  if (reviewError || !review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // RULE 9: User cannot mark their own review as helpful
  if (review.user_id === req.user.id) {
    return next(new ErrorResponse('You cannot mark your own review as helpful', 400));
  }

  // RULE 10: Can only mark active reviews as helpful
  if (review.status !== 'active') {
    return next(new ErrorResponse('Cannot mark this review as helpful', 400));
  }

  // Check if user already marked this as helpful
  const { data: existing } = await supabase
    .from('review_helpful')
    .select('id')
    .eq('review_id', req.params.id)
    .eq('user_id', req.user.id)
    .single();

  if (existing) {
    // Remove helpful mark
    const { error: deleteError } = await supabase
      .from('review_helpful')
      .delete()
      .eq('review_id', req.params.id)
      .eq('user_id', req.user.id);

    if (deleteError) {
      return next(new ErrorResponse('Error removing helpful mark', 500));
    }

    // Decrease helpful count
    const { data: updatedReview, error: updateError } = await supabase
      .rpc('decrement_helpful_count', { review_id_param: req.params.id });

    if (updateError) {
      console.error('Error updating helpful count:', updateError);
    }

    // Fetch updated review
    const { data: finalReview } = await supabase
      .from('reviews')
      .select('id, helpful_count')
      .eq('id', req.params.id)
      .single();

    return res.status(200).json({
      success: true,
      message: 'Helpful mark removed',
      data: finalReview || { id: req.params.id, helpful_count: 0 }
    });
  }

  // Add helpful mark
  const { error: insertError } = await supabase
    .from('review_helpful')
    .insert([
      {
        review_id: req.params.id,
        user_id: req.user.id
      }
    ]);

  if (insertError) {
    console.error('Error marking as helpful:', insertError);
    return next(new ErrorResponse('Error marking as helpful', 500));
  }

  // Increase helpful count
  const { data: updatedReview, error: updateError } = await supabase
    .rpc('increment_helpful_count', { review_id_param: req.params.id });

  if (updateError) {
    console.error('Error updating helpful count:', updateError);
  }

  // Fetch updated review
  const { data: finalReview } = await supabase
    .from('reviews')
    .select('id, helpful_count')
    .eq('id', req.params.id)
    .single();

  res.status(200).json({
    success: true,
    message: 'Marked as helpful',
    data: finalReview || { id: req.params.id, helpful_count: 1 }
  });
});

// @desc    Add response to review (Mitra/Admin only)
// @route   PUT /api/v1/reviews/:id/response
// @access  Private (Mitra/Admin)
exports.addResponse = asyncHandler(async (req, res, next) => {
  const { response } = req.body;

  if (!response || response.trim().length < 10) {
    return next(new ErrorResponse('Response must be at least 10 characters', 400));
  }

  // Get review with location info
  const { data: review, error: fetchError } = await supabase
    .from('reviews')
    .select(`
      *,
      location:locations!reviews_location_id_fkey(id, owner_id)
    `)
    .eq('id', req.params.id)
    .single();

  if (fetchError || !review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // RULE 11: Only mitra who owns the location or admin can respond
  const isOwner = review.location.owner_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse('Not authorized to respond to this review', 403));
  }

  // RULE 12: Can only respond to active reviews
  if (review.status !== 'active') {
    return next(new ErrorResponse('Cannot respond to this review', 400));
  }

  // Update review with response
  const { data: updatedReview, error } = await supabase
    .from('reviews')
    .update({
      response: response.trim(),
      response_date: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select(`
      *,
      location:locations!reviews_location_id_fkey(id, name)
    `)
    .single();

  if (error) {
    console.error('Error adding response:', error);
    return next(new ErrorResponse('Error adding response', 500));
  }

  res.status(200).json({
    success: true,
    message: 'Response added successfully',
    data: updatedReview
  });
});

// @desc    Flag review for moderation
// @route   PUT /api/v1/reviews/:id/flag
// @access  Private
exports.flagReview = asyncHandler(async (req, res, next) => {
  // Get review
  const { data: review, error } = await supabase
    .from('reviews')
    .select('id, flagged_count, status, user_id')
    .eq('id', req.params.id)
    .single();

  if (error || !review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  // RULE 13: User cannot flag their own review
  if (review.user_id === req.user.id) {
    return next(new ErrorResponse('You cannot flag your own review', 400));
  }

  // RULE 14: Can only flag active reviews
  if (review.status !== 'active') {
    return next(new ErrorResponse('This review is already flagged or hidden', 400));
  }

  // Increase flag count
  const newFlagCount = review.flagged_count + 1;

  // RULE 15: Auto-flag if >= 3 reports
  const newStatus = newFlagCount >= 3 ? 'flagged' : 'active';

  const { data: updatedReview, error: updateError } = await supabase
    .from('reviews')
    .update({
      flagged_count: newFlagCount,
      status: newStatus
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error flagging review:', updateError);
    return next(new ErrorResponse('Error flagging review', 500));
  }

  res.status(200).json({
    success: true,
    message: newFlagCount >= 3 
      ? 'Review has been flagged for moderation' 
      : 'Your report has been recorded',
    data: updatedReview
  });
});

// @desc    Moderate review (Admin only)
// @route   PUT /api/v1/reviews/:id/moderate
// @access  Private (Admin)
exports.moderateReview = asyncHandler(async (req, res, next) => {
  const { status, moderation_note } = req.body;

  // RULE 16: Only active or hidden status allowed
  if (!status || !['active', 'hidden'].includes(status)) {
    return next(new ErrorResponse('Please provide valid status (active/hidden)', 400));
  }

  const { data: review, error } = await supabase
    .from('reviews')
    .update({
      status,
      moderation_note: moderation_note || null,
      moderated_by: req.user.id,
      moderated_at: new Date().toISOString(),
      flagged_count: 0 // Reset flag count after moderation
    })
    .eq('id', req.params.id)
    .select(`
      *,
      user:users!reviews_user_id_fkey(id, name),
      location:locations!reviews_location_id_fkey(id, name)
    `)
    .single();

  if (error) {
    console.error('Error moderating review:', error);
    return next(new ErrorResponse('Error moderating review', 500));
  }

  if (!review) {
    return next(new ErrorResponse('Review not found', 404));
  }

  res.status(200).json({
    success: true,
    message: `Review has been ${status === 'active' ? 'approved' : 'hidden'}`,
    data: review
  });
});

// @desc    Get reviews for moderation (Admin only)
// @route   GET /api/v1/reviews/moderate/pending
// @access  Private (Admin)
exports.getPendingModeration = asyncHandler(async (req, res, next) => {
  const { data: reviews, error } = await supabase
    .from('reviews')
    .select(`
      *,
      user:users!reviews_user_id_fkey(id, name, avatar_url),
      location:locations!reviews_location_id_fkey(id, name, type)
    `)
    .eq('status', 'flagged')
    .order('flagged_count', { ascending: false });

  if (error) {
    console.error('Error fetching pending reviews:', error);
    return next(new ErrorResponse('Error fetching pending reviews', 500));
  }

  res.status(200).json({
    success: true,
    count: reviews.length,
    data: reviews
  });
});

module.exports = exports;