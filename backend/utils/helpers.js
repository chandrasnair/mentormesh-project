//utils/helpers.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Create email transporter
const createEmailTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured');
    return null;
  }
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Hash password
exports.hashPassword = async (password) => {
  return await bcrypt.hash(password, 12);
};

// Compare password
exports.comparePassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate verification token
exports.generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

// Generate JWT
exports.generateJWT = (user) => {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      roles: user.roles,
      isVerified: user.isVerified
    },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '24h' }
  );
};

// Send verification email
exports.sendVerificationEmail = async (user, token) => {
  const transporter = createEmailTransporter();
  if (!transporter) return false;
  
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}&email=${user.email}`;
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
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Send password reset email
exports.sendPasswordResetEmail = async (user, token) => {
  const transporter = createEmailTransporter();
  if (!transporter) return false;
  
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}&email=${user.email}`;
  
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
    return true;
  } catch (error) {
    console.error('Email sending error:', error);
    return false;
  }
};

// Send mentor verification email (approved/rejected)
exports.sendMentorVerificationEmail = async (mentor, status, notes) => {
  const transporter = createEmailTransporter();
  if (!transporter) return false;
  
  const isApproved = status === 'approved';
  const dashboardUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;
  
  const mailOptions = {
    from: process.env.EMAIL_USER || 'noreply@mentormesh.com',
    to: mentor.email,
    subject: isApproved 
      ? '🎉 Your Mentor Application Has Been Approved!' 
      : 'Update on Your Mentor Application',
    html: isApproved ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🎉 Congratulations!</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2c3e50;">Hello ${mentor.fullName},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
            Great news! Your mentor application has been <strong style="color: #27ae60;">approved</strong>! 
            You can now start connecting with mentees and sharing your expertise.
          </p>
          ${notes ? `
            <div style="background: white; padding: 15px; border-left: 4px solid #27ae60; margin: 20px 0;">
              <p style="margin: 0; color: #2c3e50;"><strong>Note from admin:</strong></p>
              <p style="margin: 10px 0 0 0; color: #555;">${notes}</p>
            </div>
          ` : ''}
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background-color: #27ae60; color: white; padding: 15px 40px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
              Go to Dashboard
            </a>
          </div>
          <div style="background: white; padding: 20px; border-radius: 5px; margin-top: 20px;">
            <h3 style="color: #2c3e50; margin-top: 0;">Next Steps:</h3>
            <ul style="color: #555; line-height: 1.8;">
              <li>Complete your mentor profile</li>
              <li>Set your availability schedule</li>
              <li>Start receiving mentee requests</li>
              <li>Share your knowledge and expertise</li>
            </ul>
          </div>
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px; text-align: center;">
            Thank you for being part of the MentorMesh community!
          </p>
        </div>
      </div>
    ` : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #e74c3c; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">Application Update</h1>
        </div>
        <div style="padding: 30px; background: #f8f9fa; border-radius: 0 0 10px 10px;">
          <h2 style="color: #2c3e50;">Hello ${mentor.fullName},</h2>
          <p style="font-size: 16px; line-height: 1.6; color: #34495e;">
            Thank you for your interest in becoming a mentor on MentorMesh. 
            After careful review, we are unable to approve your application at this time.
          </p>
          ${notes ? `
            <div style="background: white; padding: 15px; border-left: 4px solid #e74c3c; margin: 20px 0;">
              <p style="margin: 0; color: #2c3e50;"><strong>Reason:</strong></p>
              <p style="margin: 10px 0 0 0; color: #555;">${notes}</p>
            </div>
          ` : ''}
          <p style="color: #555; line-height: 1.6;">
            You're welcome to update your profile and reapply in the future. 
            If you have any questions, please don't hesitate to contact our support team.
          </p>
          <p style="color: #7f8c8d; font-size: 14px; margin-top: 30px; text-align: center;">
            We appreciate your understanding.
          </p>
        </div>
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