
const Location = require('../models/Location');

// Middleware untuk check ownership lokasi
exports.checkLocationOwnership = async (req, res, next) => {
  try {
    const locationId = req.params.id || req.params.locationId;
    
    // Admin bisa akses semua lokasi
    if (req.user.role === 'admin') {
      return next();
    }
    
    // Cek apakah lokasi ada
    const location = await Location.findById(locationId);
    
    if (!location) {
      return res.status(404).json({
        success: false,
        message: 'Lokasi tidak ditemukan'
      });
    }
    
    // Cek apakah user adalah pemilik lokasi
    if (location.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses ke lokasi ini'
      });
    }
    
    // Simpan location ke request untuk digunakan di controller
    req.location = location;
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan saat memeriksa akses lokasi',
      error: error.message
    });
  }
};

// Middleware untuk filter query berdasarkan role
exports.filterLocationsByRole = (req, res, next) => {
  // Jika bukan admin, tambahkan filter owner
  if (req.user.role !== 'admin') {
    req.locationFilter = { owner: req.user._id };
  } else {
    req.locationFilter = {};
  }
  
  next();
};
