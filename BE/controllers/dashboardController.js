// eco-peta-backend/controllers/dashboardController.js
const { supabase } = require('../config/supabase');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/async');

// @desc    Get dashboard overview statistics for Mitra
// @route   GET /api/v1/dashboard/overview
// @access  Private (Mitra)
exports.getMitraOverview = asyncHandler(async (req, res, next) => {
  const mitraId = req.user.id;

  try {
    // 1. Get mitra locations
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, status, rating, total_reviews')
      .eq('owner_id', mitraId);

    if (locError) {
      console.error('Error fetching locations:', locError);
      throw locError;
    }

    const locationIds = locations.map(loc => loc.id);

    // 2. Calculate location stats
    const totalLocations = locations.length;
    const activeLocations = locations.filter(l => l.status === 'approved').length;
    const verifiedLocations = locations.filter(l => l.status === 'approved').length;
    const pendingLocations = locations.filter(l => l.status === 'pending').length;

    // 3. Get pickup stats
    let totalPickups = 0;
    let pendingPickups = 0;
    let todayPickups = 0;
    let completedPickups = 0;

    if (locationIds.length > 0) {
      // Total pickups
      const { count: totalCount } = await supabase
        .from('pickup_requests')
        .select('*', { count: 'exact', head: true })
        .in('location_id', locationIds);
      
      totalPickups = totalCount || 0;

      // Pending pickups
      const { count: pendingCount } = await supabase
        .from('pickup_requests')
        .select('*', { count: 'exact', head: true })
        .in('location_id', locationIds)
        .eq('status', 'pending');
      
      pendingPickups = pendingCount || 0;

      // Today's pickups
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { count: todayCount } = await supabase
        .from('pickup_requests')
        .select('*', { count: 'exact', head: true })
        .in('location_id', locationIds)
        .gte('scheduled_date', todayStart.toISOString().split('T')[0])
        .lte('scheduled_date', todayEnd.toISOString().split('T')[0])
        .in('status', ['pending', 'accepted', 'scheduled', 'in_progress']);
      
      todayPickups = todayCount || 0;

      // Completed pickups
      const { count: completedCount } = await supabase
        .from('pickup_requests')
        .select('*', { count: 'exact', head: true })
        .in('location_id', locationIds)
        .eq('status', 'completed');
      
      completedPickups = completedCount || 0;
    }

    // 4. Calculate performance stats
    let totalWasteCollected = 0;
    let totalTransactions = 0;
    let totalRatingSum = 0;
    let totalRatingCount = 0;

    if (locationIds.length > 0) {
      // Get completed pickups for waste calculation
      const { data: completedData } = await supabase
        .from('pickup_requests')
        .select('actual_total_weight')
        .in('location_id', locationIds)
        .eq('status', 'completed')
        .not('actual_total_weight', 'is', null);

      if (completedData) {
        totalWasteCollected = completedData.reduce((sum, p) => sum + (p.actual_total_weight || 0), 0);
        totalTransactions = completedData.length;
      }

      // Calculate average rating
      locations.forEach(loc => {
        if (loc.rating && loc.total_reviews) {
          totalRatingSum += loc.rating * loc.total_reviews;
          totalRatingCount += loc.total_reviews;
        }
      });
    }

    const averageRating = totalRatingCount > 0 
      ? totalRatingSum / totalRatingCount 
      : 0;

    // 5. Prepare response
    const dashboardData = {
      locations: {
        total: totalLocations,
        active: activeLocations,
        verified: verifiedLocations,
        pending: pendingLocations,
      },
      pickups: {
        total: totalPickups,
        pending: pendingPickups,
        today: todayPickups,
        completed: completedPickups,
      },
      performance: {
        totalWasteCollected: parseFloat(totalWasteCollected.toFixed(2)),
        averageRating: parseFloat(averageRating.toFixed(2)),
        totalTransactions: totalTransactions,
      },
    };

    console.log('✅ Dashboard data:', dashboardData);

    res.status(200).json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('❌ Error in getMitraOverview:', error);
    return next(new ErrorResponse('Gagal mengambil data overview', 500));
  }
});

module.exports = exports;