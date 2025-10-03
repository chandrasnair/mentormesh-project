// routes/authRoutes.js
// Authentication routes (signup, login, verify, password reset)

const express = require('express');
const router = express.Router();

// This function will be called from your server file
// Pass in the User model and utility functions
module.exports = (User, utils) => {
  // Admin creation endpoint - Add this to your routes file

  router.post('/create-admin', async (req, res) => {
    try {
      const { fullName, email, password, confirmPassword } = req.body;

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

      if (errors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation failed', 
          errors 
        });
      }

      // Check if user exists
      const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(409).json({ 
          success: false,
          message: 'An account with this email already exists'
        });
      }

      // Hash password
      const hashedPassword = await utils.hashPassword(password);

      // Create admin user data
      const adminData = {
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        password: hashedPassword,
        roles: ['admin'],
        isVerified: true,
        accountStatus: 'active',
        verificationToken: null,
        mentorProfile: {},
        menteeProfile: {}
      };

      // Create admin user
      const adminUser = new User(adminData);
      await adminUser.save();

      // Generate JWT
      const token = utils.generateJWT(adminUser);

      // Build response
      const responseData = {
        id: adminUser._id,
        fullName: adminUser.fullName,
        email: adminUser.email,
        roles: adminUser.roles,
        isVerified: adminUser.isVerified,
        accountStatus: adminUser.accountStatus
      };

      res.status(201).json({
        success: true,
        message: 'Admin account created successfully!',
        data: { token, user: responseData }
      });

    } catch (error) {
      console.error('Admin creation error:', error);
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
        message: 'Server error during admin account creation' 
      });
    }
  });
  // Signup route
 router.post('/signup', async (req, res) => {
  try {
    const { 
      fullName, email, password, confirmPassword, roles,
      mentorSkills, mentorBio, expertise, experience,
      interests, goals, currentLevel, menteeBio, learningGoals
    } = req.body;

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
    if (!roles || !Array.isArray(roles) || roles.length === 0) {
      errors.push('Please select at least one role');
    }
    
    // Prevent admin role creation through signup
    if (roles && roles.includes('admin')) {
      errors.push('Admin accounts cannot be created through signup');
    }

    // Role-specific validations
    if (roles && roles.includes('mentor')) {
      let validatedSkills = [];
      if (typeof mentorSkills === 'string') {
        validatedSkills = mentorSkills.split(',').map(s => s.trim()).filter(s => s.length > 0);
      } else if (Array.isArray(mentorSkills)) {
        validatedSkills = mentorSkills.map(s => s?.toString().trim()).filter(s => s && s.length > 0);
      }
      if (validatedSkills.length === 0) {
        errors.push('At least one skill is required for mentors');
      }
      if (!mentorBio || mentorBio.trim().length < 10) {
        errors.push('Bio is required for mentors and must be at least 10 characters');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }

    // Check if user exists
    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false,
        message: 'An account with this email already exists'
      });
    }

    // Hash password
    const hashedPassword = await utils.hashPassword(password);
    const verificationToken = utils.generateToken();
    
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

    // Add mentor profile
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
    }

    // Add mentee profile
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
    }

    // Create user
    const user = new User(userData);
    await user.save();

    // Send verification email
    let emailSent = false;
    try {
      emailSent = await utils.sendVerificationEmail(user, verificationToken);
    } catch (error) {
      console.error('Email sending failed:', error.message);
    }

    // Generate JWT
    const token = utils.generateJWT(user);

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

    res.status(201).json({
      success: true,
      message: 'Account created successfully!',
      data: { token, user: responseData },
      nextSteps: {
        emailVerification: emailSent ? 'Verification email sent' : 'Email not sent',
        profileCompletion: user.profileCompletion.overall < 100 ? 'Complete your profile' : 'Profile completed'
      }
    });

  } catch (error) {
    console.error('Signup error:', error);
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ success: false, message: 'Validation failed', errors: validationErrors });
    }
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: 'An account with this email already exists' });
    }
    res.status(500).json({ success: false, message: 'Server error during account creation' });
  }
});

  // Login route
router.post('/login', async (req, res) => {
  try {
    const { emailOrUsername, password, role } = req.body;

    if (!emailOrUsername || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/username and password are required'
      });
    }

    // Validate role input if provided
    if (role && !['mentor', 'mentee'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid role specified. Must be either "mentor" or "mentee"'
      });
    }

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

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        message: 'Your account has been suspended. Please contact support.'
      });
    }

    // If role is specified, check if user has that role
    if (role && !user.roles.includes(role)) {
      return res.status(403).json({
        success: false,
        message: `You don't have ${role} access. Please check your role selection.`
      });
    }

    // Block pending mentors only when logging in as mentor
    if (role === 'mentor' && user.accountStatus === 'pending' && user.roles.includes('mentor')) {
      return res.status(403).json({
        success: false,
        message: 'Your mentor application is pending admin approval. You will be notified via email once approved.'
      });
    }

    const isValidPassword = await utils.comparePassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email/username or password'
      });
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = utils.generateJWT(user);

    const userData = {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified,
      accountStatus: user.accountStatus,
      profileCompletion: user.profileCompletion,
      lastLogin: user.lastLogin,
      activeRole: role || user.roles[0] // Set active role or default to first role
    };

    if (user.roles.includes('mentor')) {
      userData.mentorProfile = user.mentorProfile;
    }
    if (user.roles.includes('mentee')) {
      userData.menteeProfile = user.menteeProfile;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: { user: userData, token: accessToken }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error during login' });
  }
});
  // Verify email route
router.post('/verify-email', async (req, res) => {
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

    user.isVerified = true;
    user.verificationToken = undefined;
    
    // ONLY set accountStatus to 'active' for non-mentors
    // Mentors stay 'pending' until admin approves
    if (!user.roles.includes('mentor')) {
      user.accountStatus = 'active';
    }
    // If mentor, keep accountStatus as 'pending'
    
    await user.save();

    const message = user.roles.includes('mentor')
      ? 'Email verified successfully! Your mentor application is pending admin review.'
      : 'Email verified successfully!';

    res.json({
      success: true,
      message,
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

  // Resend verification
  router.post('/resend-verification', async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });

      if (!user) {
        return res.status(404).json({ success: false, message: 'No account found with this email' });
      }

      if (user.isVerified) {
        return res.status(200).json({ success: true, message: 'Email is already verified' });
      }

      const newVerificationToken = utils.generateToken();
      user.verificationToken = newVerificationToken;
      await user.save();

      const emailSent = await utils.sendVerificationEmail(user, newVerificationToken);

      if (!emailSent) {
        return res.status(500).json({ success: false, message: 'Failed to send verification email' });
      }

      res.json({ success: true, message: 'Verification email sent successfully' });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ success: false, message: 'Server error while resending verification email' });
    }
  });

  // Forgot password
  router.post('/forgot-password', async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      const user = await User.findOne({ email: email.toLowerCase().trim() });
      const responseMessage = 'If an account with that email exists, we have sent a password reset link.';
      
      if (!user) {
        return res.json({ success: true, message: responseMessage });
      }

      const resetToken = utils.generateToken();
      console.log(resetToken)
      user.passwordResetToken = resetToken;
      user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000);
      await user.save();

      const emailSent = await utils.sendPasswordResetEmail(user, resetToken);
      res.json({ success: true, message: responseMessage });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, message: 'Server error while processing password reset request' });
    }
  });

  // Reset password
  router.post('/reset-password', async (req, res) => {
    try {
      const { token, email, newPassword } = req.body;

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

      const hashedPassword = await utils.hashPassword(newPassword);
      user.password = hashedPassword;
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

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

  return router;
};