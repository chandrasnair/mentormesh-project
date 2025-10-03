// server.js - Single Unified Server (Refactored)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Import centralized utilities
const utils = require('./utils/helpers');

// Import models
const User = require('./models/User');
const Availability = require('./models/Availability');
const Feedback = require('./models/Feedback');

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentormesh', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

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
    const jwt = require('jsonwebtoken');
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
const feedbackRoutes = require('./routes/feedbackRoutes');

// Pass centralized utils to routes
app.use('/api', authRoutes(User, utils));
app.use('/api', userRoutes(User, authMiddleware));
app.use('/api/availability', availabilityRoutes(Availability, User));
app.use('/api/admin', adminRoutes(User, authMiddleware, utils));
app.use('/api/feedback', authMiddleware, feedbackRoutes(Feedback, User, Availability, mongoose));

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