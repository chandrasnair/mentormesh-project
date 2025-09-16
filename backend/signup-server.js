// signup-server.js
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

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/mentormesh_signup', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// User Schema for Signup
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
  role: { 
    type: String, 
    enum: {
      values: ['mentor', 'mentee'],
      message: 'Role must be either mentor or mentee'
    },
    required: [true, 'Role is required']
  },
  // Mentor-specific fields
  skills: {
    type: [String],
    default: []
  },
  bio: { 
  type: String,
  trim: true,
  maxlength: [1000, 'Bio cannot exceed 1000 characters']
},
  // Mentee-specific fields (optional for now, can be filled later)
  interests: [{ type: String, trim: true }],
  goals: { type: String, trim: true },
  currentLevel: { 
    type: String, 
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'beginner'
  },
  // Account status
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  accountStatus: { 
    type: String, 
    enum: ['pending', 'active', 'suspended'], 
    default: 'pending' 
  },
  profileCompletion: { type: Number, default: 0 } // Percentage
}, {
  timestamps: true
});

userSchema.pre('validate', function(next) {
  // Validate mentor-specific requirements
  if (this.role === 'mentor') {
    // Check skills
    if (!this.skills || !Array.isArray(this.skills) || this.skills.length === 0) {
      this.invalidate('skills', 'Skills are required for mentors');
    } else {
      // Clean and validate individual skills
      const validSkills = this.skills
        .map(skill => skill ? skill.toString().trim() : '')
        .filter(skill => skill.length > 0);
      
      if (validSkills.length === 0) {
        this.invalidate('skills', 'At least one valid skill is required for mentors');
      } else {
        this.skills = validSkills; // Update with cleaned skills
      }
    }
    
    // Check bio
    if (!this.bio || this.bio.trim().length < 10) {
      this.invalidate('bio', 'Bio is required for mentors and must be at least 10 characters');
    }
  }
  
  next();
});

// Pre-save middleware to calculate profile completion
userSchema.pre('save', function(next) {
  let completion = 0;
  const fields = ['fullName', 'email', 'password', 'role'];
  
  fields.forEach(field => {
    if (this[field]) completion += 20;
  });
  
  if (this.role === 'mentor') {
    if (this.skills && this.skills.length > 0) completion += 10;
    if (this.bio && this.bio.length > 10) completion += 10;
  }
  
  this.profileCompletion = completion;
  next();
});

const User = mongoose.model('User', userSchema);

// Email configuration (using nodemailer) 
const createEmailTransporter = () => {
  return nodemailer.createTransport({  
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS 
    }
  });
};

// Utility function to generate verification token
const generateVerificationToken = () => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// Utility function to send verification email
const sendVerificationEmail = async (user, verificationToken) => {
  const transporter = createEmailTransporter();
  
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}&email=${user.email}`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@mentormesh.com',
    to: user.email,
    subject: 'Verify Your MentorMesh Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2c3e50;">Welcome to MentorMesh, ${user.fullName}!</h2>
        <p>Thank you for joining our platform as a <strong>${user.role}</strong>.</p>
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
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    service: 'MentorMesh Signup Service',
    timestamp: new Date().toISOString()
  });
});

// Get available skills (for frontend dropdown/suggestions)
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

// Main signup route
app.post('/api/signup', async (req, res) => {
  try {
    const { 
      fullName, 
      email, 
      password, 
      confirmPassword, 
      role, 
      skills, 
      bio,
      interests,
      goals,
      currentLevel 
    } = req.body;

    console.log('Received signup data:', { fullName, email, role, skills: typeof skills, skillsContent: skills });

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

    if (!role || !['mentor', 'mentee'].includes(role)) {
      errors.push('Please select a valid role');
    }

    // Role-specific validations and processing
    let validatedSkills = [];
    if (role === 'mentor') {
      if (typeof skills === 'string') {
        // Handle comma-separated string
        validatedSkills = skills.split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
      } else if (Array.isArray(skills)) {
        // Handle array (from frontend)
        validatedSkills = skills
          .map(skill => skill ? skill.toString().trim() : '')
          .filter(skill => skill.length > 0);
      }
      
      if (validatedSkills.length === 0) {
        errors.push('At least one skill is required for mentors');
      }
      
      if (!bio || bio.trim().length < 10) {
        errors.push('Bio is required for mentors and must be at least 10 characters');
      }
    }

    if (errors.length > 0) {
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
      return res.status(409).json({ 
        success: false,
        message: 'An account with this email already exists',
        suggestion: 'Try logging in instead or use a different email address'
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate verification token
    const verificationToken = generateVerificationToken();

    // Create user object
    const userData = {
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role,
      verificationToken
    };

    // Add role-specific fields
    if (role === 'mentor') {
      userData.skills = validatedSkills;
      userData.bio = bio.trim();
    } else if (role === 'mentee') {
      if (interests) {
        if (typeof interests === 'string') {
          userData.interests = interests.split(',')
            .map(interest => interest.trim())
            .filter(interest => interest.length > 0);
        } else if (Array.isArray(interests)) {
          userData.interests = interests
            .map(interest => interest.trim())
            .filter(interest => interest.length > 0);
        }
      }
      if (goals) userData.goals = goals.trim();
      if (currentLevel) userData.currentLevel = currentLevel;
    }

    console.log('Creating user with data:', userData);

    // Create user
    const user = new User(userData);
    await user.save();

    console.log('User created successfully!');

    // Send verification email - don't fail signup if email fails
    let emailSent = false;
    let emailError = null;
    
    try {
      emailSent = await sendVerificationEmail(user, verificationToken);
    } catch (error) {
      console.error('Email sending failed:', error.message);
      emailError = error.message;
      // Continue with signup even if email fails
    }
    
    // Generate JWT token (for immediate login after signup)
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role,
        isVerified: user.isVerified 
      },
      process.env.JWT_SECRET || 'your-signup-secret-key',
      { expiresIn: '24h' }
    );

    // Response
    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: {
        token,
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          skills: user.skills,
          bio: user.bio,
          isVerified: user.isVerified,
          profileCompletion: user.profileCompletion,
          accountStatus: user.accountStatus
        }
      },
      nextSteps: {
        emailVerification: emailSent 
          ? 'Verification email sent' 
          : `Email sending failed${emailError ? ': ' + emailError : ''}. You can resend it later.`,
        profileCompletion: user.profileCompletion < 100 ? 'Complete your profile for better matching' : 'Profile completed'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);

    // Handle specific MongoDB errors
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

// Email verification route
app.post('/api/verify-email', async (req, res) => {
  try {
    const { token, email } = req.body;

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
      return res.status(404).json({
        success: false,
        message: 'Invalid verification token or email'
      });
    }

    if (user.isVerified) {
      return res.status(200).json({
        success: true,
        message: 'Email is already verified'
      });
    }

    // Update user verification status
    user.isVerified = true;
    user.accountStatus = 'active';
    user.verificationToken = undefined;
    await user.save();

    res.json({
      success: true,
      message: 'Email verified successfully!',
      data: {
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
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

// Resend verification email
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

    // Generate new verification token
    const newVerificationToken = generateVerificationToken();
    user.verificationToken = newVerificationToken;
    await user.save();

    // Send verification email
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

// Get user statistics (for admin dashboard)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 },
          verified: { $sum: { $cond: ['$isVerified', 1, 0] } }
        }
      }
    ]);

    const totalUsers = await User.countDocuments();
    const verifiedUsers = await User.countDocuments({ isVerified: true });

    res.json({
      success: true,
      data: {
        totalUsers,
        verifiedUsers,
        roleBreakdown: stats,
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
  console.log('📁 Connected to MongoDB (Signup Service)');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('📁 Disconnected from MongoDB');
});

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 MentorMesh Signup Server running on port ${PORT}`);
  console.log(`📧 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n🔄 Shutting down signup server gracefully...');
  await mongoose.connection.close();
  process.exit(0);
});