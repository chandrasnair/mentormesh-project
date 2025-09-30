// login-server.js - Updated for Dual Role Support
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0 && req.path !== '/api/login') {
    // Don't log passwords
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Database connection - IMPORTANT: Use same database as signup
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentormesh_signup', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Updated User Schema - MUST match signup server schema EXACTLY
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
  
  // Array of roles for dual role support
  roles: {
    type: [String],
    enum: {
      values: ['mentor', 'mentee', 'admin'],
      message: 'Role must be mentor, mentee, or admin'
    },
    required: [true, 'At least one role is required'],
    validate: {
      validator: function(v) {
        return v && v.length > 0;
      },
      message: 'At least one role must be selected'
    }
  },
  
  // Mentor Profile
  mentorProfile: {
    skills: {
      type: [String],
      default: []
    },
    bio: { 
      type: String,
      trim: true
    },
    expertise: {
      type: String,
      trim: true
    },
    experience: {
      type: Number,
      min: 0
    }
  },
  
  // Mentee Profile
  menteeProfile: {
    interests: {
      type: [String],
      default: []
    },
    goals: { 
      type: String, 
      trim: true 
    },
    currentLevel: { 
      type: String, 
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    bio: {
      type: String,
      trim: true
    },
    learningGoals: {
      type: [String],
      default: []
    }
  },
  
  // Account status
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  accountStatus: { 
    type: String, 
    enum: ['pending', 'active', 'suspended'], 
    default: 'pending' 
  },
  
  // Profile completion tracking per role
  profileCompletion: {
    mentor: { type: Number, default: 0 },
    mentee: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  
  lastLogin: { type: Date },
  
  // Password reset fields
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date }
}, {
  timestamps: true
});

// Helper methods
userSchema.methods.isMentor = function() {
  return this.roles.includes('mentor');
};

userSchema.methods.isMentee = function() {
  return this.roles.includes('mentee');
};

// Method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Email configuration
const createEmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured');
    return null;
  }

  try {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
  } catch (error) {
    console.error('Failed to create email transporter:', error.message);
    return null;
  }
};

// Utility function to generate JWT token
const generateAccessToken = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      roles: user.roles, // Changed from 'role' to 'roles'
      isVerified: user.isVerified
    },
    process.env.JWT_SECRET || 'your-login-secret-key',
    { expiresIn: '24h' }
  );
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'MentorMesh Login Service (Dual Role)',
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

// Main login route - Updated for dual roles
app.post('/api/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    console.log('Login attempt for:', emailOrUsername);

    // Input validation
    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }

    // Find user by email or fullName
    const user = await User.findOne({
      $or: [
        { email: emailOrUsername.toLowerCase().trim() },
        { fullName: new RegExp(`^${emailOrUsername.trim()}$`, 'i') }
      ]
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }

    console.log('User found:', user.email, 'Roles:', user.roles);

    // Check if account is suspended
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }

    console.log('Password verified successfully');

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate access token
    const accessToken = generateAccessToken(user);

    // Prepare user data for response
    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles, // Array of roles
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      profileCompletion: user.profileCompletion,
      lastLogin: user.lastLogin
    };

    // Add role-specific data
    if (user.isMentor()) {
      userData.mentorProfile = user.mentorProfile;
    }
    
    if (user.isMentee()) {
      userData.menteeProfile = user.menteeProfile;
    }

    console.log('Login successful for:', user.email);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: userData,
        token: accessToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Forgot password route
app.post('/api/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Generic message for security (don't reveal if email exists)
    const responseMessage = 'If an account with that email exists, we have sent a password reset link.';
    
    if (!user) {
      return res.json({ success: true, message: responseMessage });
    }

    // Generate reset token
    const resetToken = Math.random().toString(36).substring(2, 15) + 
                       Math.random().toString(36).substring(2, 15);
    
    console.log('Password reset token generated:', resetToken);
    
    user.passwordResetToken = resetToken;
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save();

    // Send reset email
    const transporter = createEmailTransporter();
    
    if (!transporter) {
      console.warn('Email not configured - reset token:', resetToken);
      return res.json({ 
        success: true, 
        message: responseMessage,
        debug: {
          resetToken,
          resetUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${user.email}`
        }
      });
    }

    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}&email=${user.email}`;

    const mailOptions = {
      from: process.env.EMAIL_USER || 'noreply@mentormesh.com',
      to: user.email,
      subject: 'Reset Your MentorMesh Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2c3e50;">Password Reset Request</h2>
          <p>Hello ${user.fullName},</p>
          <p>Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #e74c3c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Reset Password
            </a>
          </div>
          <p>Or copy this link: <br><span style="word-break: break-all; color: #3498db;">${resetUrl}</span></p>
          <p style="color: #e74c3c;"><strong>This link will expire in 10 minutes.</strong></p>
          <p>If you didn't request this, ignore this email.</p>
        </div>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${user.email}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
    }

    res.json({ success: true, message: responseMessage });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error while processing password reset request' 
    });
  }
});

// Reset password route
app.post('/api/reset-password', async (req, res) => {
  try {
    const { token, email, newPassword } = req.body;

    console.log('Password reset attempt for:', email);

    if (!token || !email || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token, email, and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired password reset token'
      });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset fields
    user.password = hashedPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    console.log('Password reset successful for:', user.email);

    res.json({
      success: true,
      message: 'Password reset successful. You can now login with your new password.'
    });

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting password'
    });
  }
});

// Verify token route (for protected routes)
app.post('/api/verify-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token is required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-login-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          roles: user.roles,
          isVerified: user.isVerified,
          accountStatus: user.accountStatus
        }
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }

    console.error('Token verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while verifying token'
    });
  }
});

// Get user profile (protected route)
app.get('/api/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-login-secret-key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const profileData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      profileCompletion: user.profileCompletion,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    // Add role-specific data
    if (user.isMentor()) {
      profileData.mentorProfile = user.mentorProfile;
    }
    
    if (user.isMentee()) {
      profileData.menteeProfile = user.menteeProfile;
    }

    res.json({
      success: true,
      data: {
        user: profileData
      }
    });

  } catch (error) {
    if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    console.error('Profile fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile'
    });
  }
});

// Update profile (protected route)
app.put('/api/profile', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authorization token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-login-secret-key');
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { fullName, mentorProfile, menteeProfile } = req.body;

    // Update basic fields
    if (fullName) user.fullName = fullName.trim();

    // Update mentor profile if user is a mentor
    if (user.isMentor() && mentorProfile) {
      user.mentorProfile = {
        ...user.mentorProfile,
        ...mentorProfile
      };
    }

    // Update mentee profile if user is a mentee
    if (user.isMentee() && menteeProfile) {
      user.menteeProfile = {
        ...user.menteeProfile,
        ...menteeProfile
      };
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          roles: user.roles,
          mentorProfile: user.mentorProfile,
          menteeProfile: user.menteeProfile,
          profileCompletion: user.profileCompletion
        }
      }
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating profile'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Database connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB (Login Service - Dual Role Support)');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`\nMentorMesh Login Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  console.log(`Dual role support enabled`);
  console.log(`Health check: http://localhost:${PORT}/api/health\n`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down login server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});