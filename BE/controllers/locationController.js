// controllers/locationController.js
const { supabase } = require('../config/supabase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get all locations with filters
// @route   GET /api/v1/locations
// @access  Public
exports.getLocations = asyncHandler(async (req, res, next) => {
  const { 
    type, 
    city, 
    province, 
    verified, 
    lat, 
    lng, 
    radius = 10,
    sort = '-rating',
    limit = 20,
    page = 1
  } = req.query;

  // Build query
  let query = supabase
    .from('locations')
    .select(`
      id,
      name,
      description,
      type,
      status,
      phone,
      email,
      website,
      street,
      city,
      province,
      postal_code,
      latitude,
      longitude,
      operating_hours,
      pickup_service,
      dropoff_service,
      images,
      rating,
      total_reviews,
      verified,
      owner:users!locations_owner_id_fkey(id, name, phone)
    `, { count: 'exact' })
    .eq('status', 'approved');

  // Apply filters
  if (type) {
    query = query.eq('type', type);
  }

  if (city) {
    query = query.ilike('city', `%${city}%`);
  }

  if (province) {
    query = query.ilike('province', `%${province}%`);
  }

  if (verified === 'true') {
    query = query.eq('verified', true);
  }

  // Sorting
  const sortField = sort.startsWith('-') ? sort.substring(1) : sort;
  const sortOrder = sort.startsWith('-') ? 'desc' : 'asc';
  query = query.order(sortField, { ascending: sortOrder === 'asc' });

  // Pagination
  const skip = (page - 1) * limit;
  query = query.range(skip, skip + limit - 1);

  const { data: locations, error, count } = await query;

  if (error) {
    console.error('Supabase query error in getLocations:', error); 
    return next(new ErrorResponse('Error fetching locations', 500));
  }

  // If geolocation provided, calculate distance
  if (lat && lng) {
    const { data: nearbyLocations, error: geoError } = await supabase
      .rpc('locations_nearby', {
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        radius_km: parseFloat(radius)
      });

    if (!geoError && nearbyLocations) {
      const locationsWithDistance = locations.map(loc => {
        const nearbyLoc = nearbyLocations.find(nl => nl.id === loc.id);
        return {
          ...loc,
          distance_km: nearbyLoc?.distance_km || null
        };
      });

      return res.status(200).json({
        success: true,
        count: locationsWithDistance.length,
        total: count,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(count / limit)
        },
        data: locationsWithDistance
      });
    }
  }

  res.status(200).json({
    success: true,
    count: locations.length,
    total: count,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(count / limit)
    },
    data: locations
  });
});

// @desc    Get single location
// @route   GET /api/v1/locations/:id
// @access  Public
exports.getLocation = asyncHandler(async (req, res, next) => {
  console.log('🔍 Fetching location with ID:', req.params.id);

  // Query utama untuk data lokasi
  const { data: location, error } = await supabase
    .from('locations')
    .select(`
      id,
      name,
      description,
      type,
      status,
      phone,
      email,
      website,
      street,
      city,
      province,
      postal_code,
      latitude,
      longitude,
      operating_hours,
      pickup_service,
      dropoff_service,
      images,
      rating,
      total_reviews,
      verified,
      price_list,
      accepted_waste_types,
      created_at,
      updated_at,
      owner:users!locations_owner_id_fkey(id, name, phone, email)
    `)
    .eq('id', req.params.id)
    .single();

  if (error) {
    console.error('❌ Error fetching location:', error);
    return next(new ErrorResponse('Location not found', 404));
  }

  if (!location) {
    console.error('❌ Location is null');
    return next(new ErrorResponse('Location not found', 404));
  }

  console.log('✅ Location found:', location.name);

  // Ambil reviews secara terpisah
  const { data: reviews, error: reviewsError } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      title,
      comment,
      photos,
      helpful_count,
      created_at,
      user:users(id, name, avatar_url)
    `)
    .eq('location_id', req.params.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (reviewsError) {
    console.warn('⚠️ Error fetching reviews:', reviewsError);
  }

  // Ambil accepted_waste_categories secara terpisah
  let acceptedCategories = [];
  
  if (location.accepted_waste_types && Array.isArray(location.accepted_waste_types) && location.accepted_waste_types.length > 0) {
    console.log('📦 Fetching waste categories:', location.accepted_waste_types);
    
    const { data: categories, error: catError } = await supabase
      .from('waste_categories')
      .select('id, name, icon_url, points_per_kg')
      .in('id', location.accepted_waste_types)
      .eq('is_active', true);
    
    if (catError) {
      console.warn('⚠️ Error fetching categories:', catError);
    } else if (categories) {
      acceptedCategories = categories;
      console.log('✅ Categories loaded:', categories.length);
    }
  }

  // Gabungkan semua data
  const responseData = {
    ...location,
    reviews: reviews || [],
    accepted_categories: acceptedCategories
  };

  console.log('✅ Sending response with', responseData.reviews.length, 'reviews and', responseData.accepted_categories.length, 'categories');

  res.status(200).json({
    success: true,
    data: responseData
  });
});

// @desc    Create new location
// @route   POST /api/v1/locations
// @access  Private (Mitra/Admin)
exports.createLocation = asyncHandler(async (req, res, next) => {
  const {
    name,
    description,
    type,
    phone,
    email,
    website,
    street,
    city,
    province,
    postal_code,
    latitude,
    longitude,
    operating_hours,
    accepted_waste_types,
    pickup_service,
    dropoff_service,
    price_list,
    images
  } = req.body;

  // Validate required fields
  if (!name || !type || !street || !city || !latitude || !longitude) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }

  // Check if user is mitra or admin
  if (req.user.role !== 'mitra' && req.user.role !== 'admin') {
    return next(new ErrorResponse('Only mitra or admin can create locations', 403));
  }

  const { data: location, error } = await supabase
    .from('locations')
    .insert([
      {
        owner_id: req.user.id,
        name,
        description,
        type,
        phone,
        email,
        website,
        street,
        city,
        province,
        postal_code,
        latitude,
        longitude,
        operating_hours,
        accepted_waste_types,
        pickup_service: pickup_service || false,
        dropoff_service: dropoff_service !== false,
        price_list,
        images: images || [],
        status: 'pending'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating location:', error);
    return next(new ErrorResponse('Error creating location', 500));
  }

  res.status(201).json({
    success: true,
    data: location
  });
});

// @desc    Update location
// @route   PUT /api/v1/locations/:id
// @access  Private (Owner/Admin)
exports.updateLocation = asyncHandler(async (req, res, next) => {
  const { data: location, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !location) {
    return next(new ErrorResponse('Location not found', 404));
  }

  const isOwner = location.owner_id === req.user.id;
  const isAdmin = req.user.role === 'admin';

  if (!isOwner && !isAdmin) {
    return next(new ErrorResponse('Not authorized to update this location', 403));
  }

  const {
    name,
    description,
    type,
    phone,
    email,
    website,
    street,
    city,
    province,
    postal_code,
    latitude,
    longitude,
    operating_hours,
    pickup_service,
    dropoff_service,
    images,
    price_list,
    accepted_waste_types
  } = req.body;

  const updateData = {
    name,
    description,
    type,
    phone,
    email,
    website,
    street,
    city,
    province,
    postal_code,
    latitude,
    longitude,
    operating_hours,
    pickup_service,
    dropoff_service,
    images,
    price_list,
    accepted_waste_types
  };

  if (isAdmin) {
    updateData.status = req.body.status;
    updateData.verified = req.body.verified;
    updateData.rejection_reason = req.body.status === 'rejected' ? req.body.rejection_reason : null;
  } else if (isOwner) {
    updateData.status = 'pending';
    updateData.verified = false;
  }
  
  const { data: updatedLocation, error } = await supabase
    .from('locations')
    .update(updateData)
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) {
    console.error('Supabase update error:', error); 
    return next(new ErrorResponse('Error updating location', 500));
  }

  res.status(200).json({
    success: true,
    data: updatedLocation
  });
});

// @desc    Delete location
// @route   DELETE /api/v1/locations/:id
// @access  Private (Owner/Admin)
exports.deleteLocation = asyncHandler(async (req, res, next) => {
  const { data: location, error: fetchError } = await supabase
    .from('locations')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (fetchError || !location) {
    return next(new ErrorResponse('Location not found', 404));
  }

  if (location.owner_id !== req.user.id && req.user.role !== 'admin') {
    return next(new ErrorResponse('Not authorized to delete this location', 403));
  }

  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', req.params.id);

  if (error) {
    return next(new ErrorResponse('Error deleting location', 500));
  }

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Approve location (Admin only)
// @route   PUT /api/v1/locations/:id/approve
// @access  Private (Admin)
exports.approveLocation = asyncHandler(async (req, res, next) => {
  const { data: location, error } = await supabase
    .from('locations')
    .update({
      status: 'approved',
      verified: true,
      verification_date: new Date().toISOString()
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !location) {
    return next(new ErrorResponse('Location not found', 404));
  }

  res.status(200).json({
    success: true,
    data: location
  });
});

// @desc    Reject location (Admin only)
// @route   PUT /api/v1/locations/:id/reject
// @access  Private (Admin)
exports.rejectLocation = asyncHandler(async (req, res, next) => {
  const { reason } = req.body;

  if (!reason) {
    return next(new ErrorResponse('Please provide rejection reason', 400));
  }

  const { data: location, error } = await supabase
    .from('locations')
    .update({
      status: 'rejected',
      rejection_reason: reason
    })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error || !location) {
    return next(new ErrorResponse('Location not found', 404));
  }

  res.status(200).json({
    success: true,
    data: location
  });
});

// @desc    Get location statistics (Admin only)
// @route   GET /api/v1/locations/admin/stats
// @access  Private (Admin)
exports.getLocationStats = asyncHandler(async (req, res, next) => {
  const { data: statusStats, error: statusError } = await supabase
    .from('locations')
    .select('status')
    .then(result => {
      const stats = {
        total: result.data.length,
        pending: result.data.filter(l => l.status === 'pending').length,
        approved: result.data.filter(l => l.status === 'approved').length,
        rejected: result.data.filter(l => l.status === 'rejected').length,
        suspended: result.data.filter(l => l.status === 'suspended').length
      };
      return { data: stats, error: null };
    });

  const { data: typeStats, error: typeError } = await supabase
    .from('locations')
    .select('type')
    .then(result => {
      const stats = {
        bank_sampah: result.data.filter(l => l.type === 'bank_sampah').length,
        jasa_angkut: result.data.filter(l => l.type === 'jasa_angkut').length,
        both: result.data.filter(l => l.type === 'both').length
      };
      return { data: stats, error: null };
    });

  const { data: topLocations, error: topError } = await supabase
    .from('locations')
    .select('id, name, rating, total_reviews')
    .eq('status', 'approved')
    .order('rating', { ascending: false })
    .limit(5);

  res.status(200).json({
    success: true,
    data: {
      byStatus: statusStats,
      byType: typeStats,
      topRated: topLocations
    }
  });
});

// @desc    Get all locations for dashboard (Admin/Mitra)
// @route   GET /api/v1/locations/dashboard
// @access  Private (Admin, Mitra)
exports.getDashboardLocations = asyncHandler(async (req, res, next) => {
  const { status, type } = req.query;

  let query = supabase
    .from('locations')
    .select(`
      *,
      owner:users!locations_owner_id_fkey(id, name)
    `, { count: 'exact' });

  if (req.user.role === 'admin') {
    // Admin can see all
  } else if (req.user.role === 'mitra') {
    query = query.eq('owner_id', req.user.id);
  } else {
    return res.status(200).json({ success: true, count: 0, total: 0, data: [] });
  }

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (type && type !== 'all') {
    query = query.eq('type', type);
  }

  query = query.order('created_at', { ascending: false });

  const { data: locations, error, count } = await query;

  if (error) {
    console.error('getDashboardLocations error:', error);
    return next(new ErrorResponse('Error fetching dashboard locations', 500));
  }

  res.status(200).json({
    success: true,
    count: locations.length,
    total: count,
    data: locations
  });
});

// Helper function untuk RPC nearby locations (tambahkan jika belum ada di database)
// CREATE OR REPLACE FUNCTION locations_nearby(lat DECIMAL, lng DECIMAL, radius_km DECIMAL)
// RETURNS TABLE (
//   id UUID,
//   distance_km DECIMAL
// ) AS $
// BEGIN
//   RETURN QUERY
//   SELECT 
//     l.id,
//     (
//       6371 * acos(
//         cos(radians(lat)) * cos(radians(l.latitude)) *
//         cos(radians(l.longitude) - radians(lng)) +
//         sin(radians(lat)) * sin(radians(l.latitude))
//       )
//     )::DECIMAL(10,2) AS distance_km
//   FROM locations l
//   WHERE (
//     6371 * acos(
//       cos(radians(lat)) * cos(radians(l.latitude)) *
//       cos(radians(l.longitude) - radians(lng)) +
//       sin(radians(lat)) * sin(radians(l.latitude))
//     )
//   ) <= radius_km
//   ORDER BY distance_km;
// END;
// $ LANGUAGE plpgsql;

module.exports = exports;