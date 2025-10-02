// routes/userRoutes.js
// User management routes (profile, add-role, stats)

const express = require('express');
const router = express.Router();

module.exports = (User, authMiddleware) => {

  // Get skills list
  router.get('/skills', (req, res) => {
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

  // Get user profile (protected)
  router.get('/profile', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.userId).select('-password');

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

      if (user.roles.includes('mentor')) {
        profileData.mentorProfile = user.mentorProfile;
      }
      if (user.roles.includes('mentee')) {
        profileData.menteeProfile = user.menteeProfile;
      }

      res.json({
        success: true,
        data: { user: profileData }
      });

    } catch (error) {
      console.error('Profile fetch error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching profile'
      });
    }
  });

  // Update profile (protected)
  router.put('/profile', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      const { fullName, mentorProfile, menteeProfile } = req.body;

      if (fullName) user.fullName = fullName.trim();

      if (user.roles.includes('mentor') && mentorProfile) {
        user.mentorProfile = {
          ...user.mentorProfile,
          ...mentorProfile
        };
      }

      if (user.roles.includes('mentee') && menteeProfile) {
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

  // Add role to existing user
  router.post('/add-role', async (req, res) => {
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

  // Get public mentor profile by ID
  router.get('/mentors/:mentorId', async (req, res) => {
    try {
      const { mentorId } = req.params;

      const mentor = await User.findOne({
        _id: mentorId,
        roles: 'mentor',
        accountStatus: 'active',
        isVerified: true
      }).select('fullName email mentorProfile createdAt lastLogin');

      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: 'Mentor not found or not available'
        });
      }

      res.json({
        success: true,
        data: { mentor }
      });

    } catch (error) {
      console.error('Get mentor error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching mentor'
      });
    }
  });

  // Get user statistics
  router.get('/stats', async (req, res) => {
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

  // Verify token
  router.post('/verify-token', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.userId).select('-password');

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
      console.error('Token verification error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while verifying token'
      });
    }
  });

  return router;
};