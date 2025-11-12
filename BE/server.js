require('dotenv').config();

const express = require('express');
const path = require('path');
const morgan = require('morgan');
const cors = require('cors');
const helmet = require('helmet');

const rateLimit = require('express-rate-limit');
const { supabase } = require('./config/supabase');
const errorHandler = require('./middleware/error');

// Import routes
const authRoutes = require('./routes/authRoutes');
const locationRoutes = require('./routes/locationRoutes');
const pickupRoutes = require('./routes/pickupRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const adminRoutes = require('./routes/adminRoutes');
const wasteCategoryRoutes = require('./routes/wasteCategoryRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

app.set('trust proxy', 1);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Security middleware
app.use(helmet());

// CORS
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true
}));

// Dev logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// Health check
app.get('/health', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (error) throw error;
    
    res.status(200).json({
      success: true,
      message: 'Server is running',
      database: 'Connected to Supabase',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server is running but database connection failed',
      error: error.message
    });
  }
});

app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));


// API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/locations', locationRoutes);
app.use('/api/v1/pickups', pickupRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/waste-categories', wasteCategoryRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/auth', authRoutes);



// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Tentukan PORT
const PORT = process.env.PORT || 5000;

let server;

// Jalankan server HANYA jika file ini dieksekusi langsung
// Ini adalah praktik terbaik agar file ini bisa diimpor untuk testing
if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🌱 ECO-PETE API SERVER RUNNING     ║
╠════════════════════════════════════════╣
║   Environment: ${process.env.NODE_ENV || 'development'}
║   Port: ${PORT}
║   Database: Supabase (PostgreSQL)
║   Time: ${new Date().toLocaleString('id-ID')}
╚════════════════════════════════════════╝
    `);
  });

  // Handle unhandled promise rejections
  // Pindahkan ke dalam blok ini agar hanya aktif saat server berjalan
  process.on('unhandledRejection', (err) => {
    console.error(`Error: ${err.message}`);
    if (server) {
      server.close(() => process.exit(1));
    } else {
      process.exit(1);
    }
  });
}

// Ekspor app untuk testing
module.exports = app;

