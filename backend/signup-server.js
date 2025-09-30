// signup-server.js - Fixed Version with Logging
const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const nodemailer = require('nodemailer'); // Make sure this is installed: npm install nodemailer
require('dotenv').config();

const app = express();

// Middleware - MUST be before routes
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`\n📨 ${req.method} ${req.path}`);
  if (Object.keys(req.body).length > 0) {
    console.log('Request Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentormesh_signup', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Updated User Schema with Dual Role Support
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
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters']
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
      trim: true,
      maxlength: [1000, 'Bio cannot exceed 1000 characters']
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
  }
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

userSchema.methods.addRole = function(role) {
  if (!this.roles.includes(role)) {
    this.roles.push(role);
  }
};

userSchema.methods.removeRole = function(role) {
  this.roles = this.roles.filter(r => r !== role);
};

// Pre-validate to ensure role-specific requirements
userSchema.pre('validate', function(next) {
  // Validate mentor profile if mentor role is selected
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

// Pre-save middleware to calculate profile completion
userSchema.pre('save', function(next) {
  const baseFields = ['fullName', 'email', 'password'];
  let baseCompletion = 0;
  
  baseFields.forEach(field => {
    if (this[field]) baseCompletion += (100 / 3) / baseFields.length;
  });
  
  // Calculate mentor profile completion
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
  
  // Calculate mentee profile completion
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
  
  // Calculate overall completion
  const activeProfiles = [];
  if (this.roles.includes('mentor')) activeProfiles.push(this.profileCompletion.mentor);
  if (this.roles.includes('mentee')) activeProfiles.push(this.profileCompletion.mentee);
  
  this.profileCompletion.overall = activeProfiles.length > 0
    ? Math.round(activeProfiles.reduce((a, b) => a + b, 0) / activeProfiles.length)
    : 0;
  
  next();
});

const User = mongoose.model('User', userSchema);

// Email configuration - Fixed version
const createEmailTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email credentials not configured in .env file');
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
    console.error('❌ Failed to create email transporter:', error.message);
    return null;
  }
};

const generateVerificationToken = () => {
  const token = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  console.log('🔑 Generated verification token:', token);
  return token;
};

const sendVerificationEmail = async (user, verificationToken) => {
  const transporter = createEmailTransporter();
  
  if (!transporter) {
    console.warn('⚠️  Email transporter not available - skipping email');
    return false;
  }

  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${user.email}`;
  
  console.log('📧 Verification URL:', verificationUrl);
  
  const roleText = user.roles.length > 1 
    ? `both a <strong>mentor</strong> and a <strong>mentee</strong>`
    : `a <strong>${user.roles[0]}</strong>`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@mentormesh.com',
    to: user.email,
    subject: 'Verify Your MentorMesh Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to MentorMesh, ${user.fullName}!</h2>
        <p>Thank you for joining our platform as ${roleText}.</p>
        <p>Please click the button below to verify your email address:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" 
             style="background-color: #3498db; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>Or copy and paste this link in your browser:</p>
        <p style="word-break: break-all; color: #3498db;">${verificationUrl}</p>
        <p style="color: #7f8c8d; font-size: 14px; margin-top: 40px;">
          If you didn't create this account, please ignore this email.
        </p>
      </div>
    `
  };
  
  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Verification email sent to:', user.email);
    return true;
  } catch (error) {
    console.error('❌ Email sending error:', error.message);
    return false;
  }
};

// Routes

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'MentorMesh Signup Service (Dual Role)',
    timestamp: new Date().toISOString(),
    emailConfigured: !!(process.env.EMAIL_USER && process.env.EMAIL_PASS)
  });
});

app.get('/api/skills', (req, res) => {
  const popularSkills = [
    'JavaScript', 'Python', 'React', 'Node.js', 'Data Science',
    'Machine Learning', 'UI/UX Design', 'Project Management',
    'Digital Marketing', 'Business Strategy', 'Leadership',
    'Communication', 'Sales', 'Finance', 'Entrepreneurship',
    'Web Development', 'Mobile Development', 'DevOps',
    'Cybersecurity', 'Cloud Computing', 'Artificial Intelligence'
  ];
  
  res.json({ skills: popularSkills });
});

// Main signup route - Fixed with better logging
app.post('/api/signup', async (req, res) => {
  try {
    console.log('\n🎯 ===== SIGNUP REQUEST =====');
    console.log('Raw body received:', req.body);
    
    const { 
      fullName, 
      email, 
      password, 
      confirmPassword, 
      roles,
      // Mentor fields
      mentorSkills,
      mentorBio,
      expertise,
      experience,
      // Mentee fields
      interests,
      goals,
      currentLevel,
      menteeBio,
      learningGoals
    } = req.body;

    console.log('📋 Parsed data:', { 
      fullName, 
      email, 
      roles,
      hasMentorSkills: !!mentorSkills,
      hasMentorBio: !!mentorBio,
      hasInterests: !!interests
    });

    // Input validation
    const errors = [];

    if (!fullName || fullName.trim().length < 2) {
      errors.push('Full name must be at least 2 characters long');
    }

    if (!email || !/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email)) {
      errors.push('Please enter a valid email address');
    }

    if (!password || password.length < 6) {
      errors.push('Password must be at least 6 characters long');
    }

    if (password !== confirmPassword) {
      errors.push('Passwords do not match');
    }

    // Validate roles
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      errors.push('Please select at least one role');
    }

    const validRoles = ['mentor', 'mentee'];
    const invalidRoles = roles?.filter(r => !validRoles.includes(r));
    if (invalidRoles && invalidRoles.length > 0) {
      errors.push(`Invalid role(s): ${invalidRoles.join(', ')}`);
    }

    // Role-specific validations
    if (roles && roles.includes('mentor')) {
      let validatedSkills = [];
      if (typeof mentorSkills === 'string') {
        validatedSkills = mentorSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(mentorSkills)) {
        validatedSkills = mentorSkills.map(s => s?.toString().trim()).filter(s => s && s.length > 0);
      }
      
      console.log('🔍 Validated mentor skills:', validatedSkills);
      
      if (validatedSkills.length === 0) {
        errors.push('At least one skill is required for mentors');
      }
      
      if (!mentorBio || mentorBio.trim().length < 10) {
        errors.push('Bio is required for mentors and must be at least 10 characters');
      }
    }

    if (errors.length > 0) {
      console.log('❌ Validation errors:', errors);
      return res.status(400).json({ 
        success: false,
        message: 'Validation failed', 
        errors 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });
    
    if (existingUser) {
      console.log('❌ User already exists:', email);
      return res.status(409).json({ 
        success: false,
        message: 'An account with this email already exists',
        suggestion: 'Try logging in instead or use a different email address'
      });
    }

    // Hash password
    console.log('🔐 Hashing password...');
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Build user data
    const userData = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      roles: roles,
      verificationToken,
      mentorProfile: {},
      menteeProfile: {}
    };

    // Add mentor profile data
    if (roles.includes('mentor')) {
      let validatedSkills = [];
      if (typeof mentorSkills === 'string') {
        validatedSkills = mentorSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(mentorSkills)) {
        validatedSkills = mentorSkills.map(s => s?.toString().trim()).filter(s => s && s.length > 0);
      }
      
      userData.mentorProfile = {
        skills: validatedSkills,
        bio: mentorBio?.trim(),
        expertise: expertise?.trim(),
        experience: experience ? Number(experience) : undefined
      };
      
      console.log('👨‍🏫 Mentor profile:', userData.mentorProfile);
    }

    // Add mentee profile data
    if (roles.includes('mentee')) {
      let validatedInterests = [];
      if (typeof interests === 'string') {
        validatedInterests = interests.split(',').map(i => i.trim()).filter(i => i.length > 0);
      } else if (Array.isArray(interests)) {
        validatedInterests = interests.map(i => i?.trim()).filter(i => i && i.length > 0);
      }
      
      let validatedLearningGoals = [];
      if (typeof learningGoals === 'string') {
        validatedLearningGoals = learningGoals.split(',').map(g => g.trim()).filter(g => g.length > 0);
      } else if (Array.isArray(learningGoals)) {
        validatedLearningGoals = learningGoals.map(g => g?.trim()).filter(g => g && g.length > 0);
      }
      
      userData.menteeProfile = {
        interests: validatedInterests,
        goals: goals?.trim(),
        currentLevel: currentLevel || 'beginner',
        bio: menteeBio?.trim(),
        learningGoals: validatedLearningGoals
      };
      
      console.log('👨‍🎓 Mentee profile:', userData.menteeProfile);
    }

    console.log('💾 Creating user in database...');

    // Create and save user
    const user = new User(userData);
    await user.save();

    console.log('✅ User created successfully! ID:', user._id);

    // Send verification email
    let emailSent = false;
    let emailError = null;
    
    try {
      emailSent = await sendVerificationEmail(user, verificationToken);
    } catch (error) {
      console.error('❌ Email sending failed:', error.message);
      emailError = error.message;
    }
    
    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        roles: user.roles,
        isVerified: user.isVerified 
      },
      process.env.JWT_SECRET || 'your-signup-secret-key',
      { expiresIn: '24h' }
    );

    // Build response
    const responseData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
      profileCompletion: user.profileCompletion,
      accountStatus: user.accountStatus
    };

    if (user.roles.includes('mentor')) {
      responseData.mentorProfile = user.mentorProfile;
    }

    if (user.roles.includes('mentee')) {
      responseData.menteeProfile = user.menteeProfile;
    }

    console.log('🎉 Signup successful!');
    console.log('===========================\n');

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        token,
        user: responseData
      },
      nextSteps: {
        emailVerification: emailSent 
          ? 'Verification email sent' 
          : `Email not sent${emailError ? ': ' + emailError : ' (email not configured)'}. You can verify later.`,
        profileCompletion: user.profileCompletion.overall < 100 
          ? 'Complete your profile(s) for better matching' 
          : 'Profile completed',
        availability: user.roles.includes('mentor') 
          ? 'Add your availability slots to start accepting bookings' 
          : null
      },
      debug: {
        verificationToken: verificationToken,
        verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${user.email}`
      }
    });

  } catch (error) {
    console.error('💥 Signup error:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'An account with this email already exists'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during account creation',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Add role to existing user
app.post('/api/add-role', async (req, res) => {
  try {
    const { userId, role, profileData } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: 'User ID and role are required'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (user.roles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `User already has the ${role} role`
      });
    }

    user.roles.push(role);

    if (role === 'mentor' && profileData) {
      user.mentorProfile = {
        ...user.mentorProfile,
        ...profileData
      };
    } else if (role === 'mentee' && profileData) {
      user.menteeProfile = {
        ...user.menteeProfile,
        ...profileData
      };
    }

    await user.save();

    res.json({
      success: true,
      message: `${role} role added successfully`,
      data: {
        user: {
          id: user._id,
          roles: user.roles,
          profileCompletion: user.profileCompletion
        }
      }
    });

  } catch (error) {
    console.error('Add role error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while adding role'
    });
  }
});

// Email verification route
app.post('/api/verify-email', async (req, res) => {
  try {
    const { token, email } = req.body;

    console.log('🔍 Verifying email:', { token, email });

    if (!token || !email) {
      return res.status(400).json({
        success: false,
        message: 'Verification token and email are required'
      });
    }

    const user = await User.findOne({
      email: email.toLowerCase().trim(),
      verificationToken: token
    });

    if (!user) {
      console.log('❌ Invalid token or email');
      return res.status(404).json({
        success: false,
        message: 'Invalid verification token or email'
      });
    }

    if (user.isVerified) {
      console.log('ℹ️  Email already verified');
      return res.status(200).json({
        success: true,
        message: 'Email is already verified'
      });
    }

    user.isVerified = true;
    user.accountStatus = 'active';
    user.verificationToken = undefined;
    await user.save();

    console.log('✅ Email verified successfully');

    res.json({
      success: true,
      message: 'Email verified successfully!',
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
    console.error('Email verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during email verification'
    });
  }
});

app.post('/api/resend-verification', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const user = await User.findOne({ 
      email: email.toLowerCase().trim() 
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email'
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified'
      });
    }

    const newVerificationToken = generateVerificationToken();
    user.verificationToken = newVerificationToken;
    await user.save();

    const emailSent = await sendVerificationEmail(user, newVerificationToken);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email'
      });
    }

    res.json({
      success: true,
      message: 'Verification email sent successfully'
    });

  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending verification email'
    });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });
    
    const mentorCount = await User.countDocuments({ roles: 'mentor' });
    const menteeCount = await User.countDocuments({ roles: 'mentee' });
    const dualRoleCount = await User.countDocuments({ 
      roles: { $all: ['mentor', 'mentee'] }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        mentorCount,
        menteeCount,
        dualRoleCount,
        verificationRate: totalUsers > 0 ? (verifiedUsers / totalUsers * 100).toFixed(1) : 0
      }
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching statistics'
    });
  }
});

app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Something went wrong',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

mongoose.connection.on('connected', () => {
  console.log('✅ Connected to MongoDB (Signup Service)');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📁 Disconnected from MongoDB');
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`\n🚀 MentorMesh Signup Server running on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✉️  Email configured: ${!!(process.env.EMAIL_USER && process.env.EMAIL_PASS)}`);
  console.log(`✨ Dual role support enabled`);
  console.log(`📍 Health check: http://localhost:${PORT}/api/health\n`);
});

process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down signup server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});