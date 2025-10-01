// server.js - Single Unified Server (Refactored)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();

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
// MODELS
// =============================================

// User Model
const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  roles: {
    type: [String],
    enum: ['mentor', 'mentee', 'admin'],
    required: [true, 'At least one role is required'],
    validate: {
      validator: function(v) { return v && v.length > 0; },
      message: 'At least one role must be selected'
    }
  },
  mentorProfile: {
    skills: { type: [String], default: [] },
    bio: { type: String, trim: true, maxlength: 1000 },
    expertise: { type: String, trim: true },
    experience: { type: Number, min: 0 }
  },
  menteeProfile: {
    interests: { type: [String], default: [] },
    goals: { type: String, trim: true },
    currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    bio: { type: String, trim: true, maxlength: 1000 },
    learningGoals: { type: [String], default: [] }
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  accountStatus: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
  profileCompletion: {
    mentor: { type: Number, default: 0 },
    mentee: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  lastLogin: { type: Date }
}, { timestamps: true });

// User methods
userSchema.methods.isMentor = function() {
  return this.roles.includes('mentor');
};

userSchema.methods.isMentee = function() {
  return this.roles.includes('mentee');
};

// Pre-validate
userSchema.pre('validate', function(next) {
  if (this.roles.includes('mentor')) {
    if (!this.mentorProfile.skills || this.mentorProfile.skills.length === 0) {
      this.invalidate('mentorProfile.skills', 'Skills are required for mentors');
    }
    if (!this.mentorProfile.bio || this.mentorProfile.bio.trim().length < 10) {
      this.invalidate('mentorProfile.bio', 'Bio is required for mentors and must be at least 10 characters');
    }
  }
  next();
});

// Calculate profile completion
userSchema.pre('save', function(next) {
  const baseFields = ['fullName', 'email', 'password'];
  let baseCompletion = 0;
  baseFields.forEach(field => {
    if (this[field]) baseCompletion += (100 / 3) / baseFields.length;
  });
  
  if (this.roles.includes('mentor')) {
    let mentorCompletion = baseCompletion;
    const mentorFields = [
      { field: 'skills', weight: 30 },
      { field: 'bio', weight: 30 },
      { field: 'expertise', weight: 20 },
      { field: 'experience', weight: 20 }
    ];
    mentorFields.forEach(({ field, weight }) => {
      const value = this.mentorProfile[field];
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        mentorCompletion += weight;
      }
    });
    this.profileCompletion.mentor = Math.min(100, Math.round(mentorCompletion));
  }
  
  if (this.roles.includes('mentee')) {
    let menteeCompletion = baseCompletion;
    const menteeFields = [
      { field: 'interests', weight: 25 },
      { field: 'goals', weight: 25 },
      { field: 'currentLevel', weight: 20 },
      { field: 'bio', weight: 15 }
    ];
    menteeFields.forEach(({ field, weight }) => {
      const value = this.menteeProfile[field];
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        menteeCompletion += weight;
      }
    });
    this.profileCompletion.mentee = Math.min(100, Math.round(menteeCompletion));
  }
  
  const activeProfiles = [];
  if (this.roles.includes('mentor')) activeProfiles.push(this.profileCompletion.mentor);
  if (this.roles.includes('mentee')) activeProfiles.push(this.profileCompletion.mentee);
  
  this.profileCompletion.overall = activeProfiles.length > 0
    ? Math.round(activeProfiles.reduce((a, b) => a + b, 0) / activeProfiles.length)
    : 0;
  
  next();
});

const User = mongoose.model('User', userSchema);

// Availability Model
const availabilitySchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  isBooked: { type: Boolean, default: false, index: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  status: {
    type: String,
    enum: ['available', 'booked', 'completed', 'cancelled'],
    default: 'available',
    index: true
  },
  meetingLink: { type: String, trim: true },
  notes: { type: String, trim: true, maxlength: 500 },
  timezone: { type: String, default: 'UTC' }
}, { timestamps: true });

availabilitySchema.index({ mentorId: 1, date: 1, isBooked: 1 });
availabilitySchema.index({ date: 1, status: 1 });

availabilitySchema.pre('validate', function(next) {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    if (endMinutes <= startMinutes) {
      this.invalidate('endTime', 'End time must be after start time');
    }
  }
  next();
});

availabilitySchema.methods.book = function(menteeId, bookingId) {
  this.isBooked = true;
  this.bookedBy = menteeId;
  this.bookingId = bookingId;
  this.status = 'booked';
  return this.save();
};

availabilitySchema.methods.cancel = function() {
  this.isBooked = false;
  this.bookedBy = null;
  this.bookingId = null;
  this.status = 'available';
  return this.save();
};

availabilitySchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

const Availability = mongoose.model('Availability', availabilitySchema);

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

// Pass centralized utils to routes
app.use('/api', authRoutes(User, utils));
app.use('/api', userRoutes(User, authMiddleware));
app.use('/api/availability', availabilityRoutes(Availability));
app.use('/api/admin', adminRoutes(User, authMiddleware, utils));

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