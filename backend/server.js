// server.js - Single Unified Server (Refactored)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');

// Add path import for .env loading and static files
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

// Import centralized utilities
const utils = require('./utils/helpers');

const app = express();

// =============================================
// MIDDLEWARE
// =============================================
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// =============================================
// DATABASE CONNECTION
// =============================================
mongoose.connect(process.env.MONGODB_URI, {
  // Removed deprecated options
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

// =============================================
// MODELS
// =============================================

const User = require('./models/User');
const Availability = require('./models/Availability');

// =============================================
// AUTH MIDDLEWARE
// =============================================

const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRoles = decoded.roles;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

// =============================================
// ROUTES
// =============================================

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const availabilityRoutes = require('./routes/availabilityRoutes');
const adminRoutes = require('./routes/adminRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const mentorsRoutes = require('./routes/mentorsRoutes');
const testimonialsRoutes = require('./routes/testimonialsRoutes');
const statsRoutes = require('./routes/statsRoutes');
const skillsRoutes = require('./routes/skillsRoutes');

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Pass centralized utils to routes
app.use('/api', authRoutes(User, utils));
app.use('/api', userRoutes(User, authMiddleware));
// Upload routes will be added once multer is available
app.use('/api/availability', availabilityRoutes(Availability, authMiddleware));
app.use('/api/admin', adminRoutes(User, authMiddleware, utils));
app.use('/api/sessions', sessionRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/mentors', mentorsRoutes());
app.use('/api/testimonials', testimonialsRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/skills', skillsRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'MentorMesh Unified Server',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
  });
});

// =============================================
// ERROR HANDLING
// =============================================

app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// =============================================
// START SERVER
// =============================================

const PORT = process.env.PORT || 5000;

mongoose.connection.once('open', () => {
  app.listen(PORT, () => {
    console.log('\n' + '='.repeat(50));
    console.log('🚀 MentorMesh Server');
    console.log('='.repeat(50));
    console.log(`📍 Port: ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 URL: http://localhost:${PORT}`);
    console.log(`💚 Health: http://localhost:${PORT}/api/health`);
    console.log('='.repeat(50) + '\n');
  });
});

process.on('SIGINT', async () => {
  console.log('\n⚠️  Shutting down gracefully...');
  await mongoose.connection.close();
  console.log('✅ MongoDB connection closed');
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
