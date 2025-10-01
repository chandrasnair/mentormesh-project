// routes/adminRoutes.js
const express = require('express');

module.exports = (User, authMiddleware, utils) => {
  const router = express.Router();

  // Admin middleware - checks if user has admin role
  const adminMiddleware = async (req, res, next) => {
    try {
      if (!req.userRoles || !req.userRoles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin privileges required.'
        });
      }
      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error checking admin privileges',
        error: error.message
      });
    }
  };

  // Get all users with filtering (admin only)
  router.get('/users', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { role, status, verified, page = 1, limit = 20, search } = req.query;
      
      const query = {};
      
      // Filter by role
      if (role) {
        query.roles = role;
      }
      
      // Filter by account status
      if (status) {
        query.accountStatus = status;
      }
      
      // Filter by verification status
      if (verified !== undefined) {
        query.isVerified = verified === 'true';
      }
      
      // Search by name or email
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [users, total] = await Promise.all([
        User.find(query)
          .select('-password -verificationToken -passwordResetToken')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit)),
        User.countDocuments(query)
      ]);
      
      res.json({
        success: true,
        data: {
          users,
          pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            pages: Math.ceil(total / parseInt(limit))
          }
        }
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching users',
        error: error.message
      });
    }
  });

  // Get pending mentors (mentors waiting for verification)
  router.get('/mentors/pending', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const pendingMentors = await User.find({
        roles: 'mentor',
        accountStatus: 'pending'
      })
        .select('-password -verificationToken -passwordResetToken')
        .sort({ createdAt: -1 });
      
      res.json({
        success: true,
        data: {
          mentors: pendingMentors,
          count: pendingMentors.length
        }
      });
    } catch (error) {
      console.error('Error fetching pending mentors:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching pending mentors',
        error: error.message
      });
    }
  });

  // Get mentor details (admin only)
  router.get('/mentors/:mentorId', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const mentor = await User.findOne({
        _id: req.params.mentorId,
        roles: 'mentor'
      }).select('-password -verificationToken -passwordResetToken');
      
      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: 'Mentor not found'
        });
      }
      
      res.json({
        success: true,
        data: { mentor }
      });
    } catch (error) {
      console.error('Error fetching mentor:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching mentor details',
        error: error.message
      });
    }
  });

  // Verify/Approve a mentor
  router.post('/mentors/:mentorId/verify', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { mentorId } = req.params;
      const { notes } = req.body;
      
      const mentor = await User.findOne({
        _id: mentorId,
        roles: 'mentor'
      });
      
      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: 'Mentor not found'
        });
      }
      
      if (mentor.accountStatus === 'active') {
        return res.status(400).json({
          success: false,
          message: 'Mentor is already verified'
        });
      }
      
      // Update mentor status
      mentor.accountStatus = 'active';
      mentor.isVerified = true;
      await mentor.save();
      
      // Send verification success email
      const emailSent = await utils.sendMentorVerificationEmail(mentor, 'approved', notes);
      
      res.json({
        success: true,
        message: 'Mentor verified successfully',
        data: {
          mentor: {
            _id: mentor._id,
            fullName: mentor.fullName,
            email: mentor.email,
            accountStatus: mentor.accountStatus,
            isVerified: mentor.isVerified
          },
          emailSent
        }
      });
    } catch (error) {
      console.error('Error verifying mentor:', error);
      res.status(500).json({
        success: false,
        message: 'Error verifying mentor',
        error: error.message
      });
    }
  });

  // Reject a mentor application
  router.post('/mentors/:mentorId/reject', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { mentorId } = req.params;
      const { reason } = req.body;
      
      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Rejection reason is required'
        });
      }
      
      const mentor = await User.findOne({
        _id: mentorId,
        roles: 'mentor'
      });
      
      if (!mentor) {
        return res.status(404).json({
          success: false,
          message: 'Mentor not found'
        });
      }
      
      // Update mentor status to suspended
      mentor.accountStatus = 'suspended';
      await mentor.save();
      
      // Send rejection email
      const emailSent = await utils.sendMentorVerificationEmail(mentor, 'rejected', reason);
      
      res.json({
        success: true,
        message: 'Mentor application rejected',
        data: {
          mentor: {
            _id: mentor._id,
            fullName: mentor.fullName,
            email: mentor.email,
            accountStatus: mentor.accountStatus
          },
          emailSent
        }
      });
    } catch (error) {
      console.error('Error rejecting mentor:', error);
      res.status(500).json({
        success: false,
        message: 'Error rejecting mentor',
        error: error.message
      });
    }
  });

  // Suspend a user
  router.post('/users/:userId/suspend', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      const { reason } = req.body;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      // Don't allow suspending other admins
      if (user.roles.includes('admin')) {
        return res.status(403).json({
          success: false,
          message: 'Cannot suspend admin users'
        });
      }
      
      user.accountStatus = 'suspended';
      await user.save();
      
      res.json({
        success: true,
        message: 'User suspended successfully',
        data: {
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            accountStatus: user.accountStatus
          }
        }
      });
    } catch (error) {
      console.error('Error suspending user:', error);
      res.status(500).json({
        success: false,
        message: 'Error suspending user',
        error: error.message
      });
    }
  });

  // Reactivate a user
  router.post('/users/:userId/reactivate', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }
      
      user.accountStatus = 'active';
      await user.save();
      
      res.json({
        success: true,
        message: 'User reactivated successfully',
        data: {
          user: {
            _id: user._id,
            fullName: user.fullName,
            email: user.email,
            accountStatus: user.accountStatus
          }
        }
      });
    } catch (error) {
      console.error('Error reactivating user:', error);
      res.status(500).json({
        success: false,
        message: 'Error reactivating user',
        error: error.message
      });
    }
  });

  // Get platform statistics (admin dashboard)
  router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
      const [
        totalUsers,
        totalMentors,
        totalMentees,
        pendingMentors,
        activeMentors,
        verifiedUsers,
        suspendedUsers
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ roles: 'mentor' }),
        User.countDocuments({ roles: 'mentee' }),
        User.countDocuments({ roles: 'mentor', accountStatus: 'pending' }),
        User.countDocuments({ roles: 'mentor', accountStatus: 'active' }),
        User.countDocuments({ isVerified: true }),
        User.countDocuments({ accountStatus: 'suspended' })
      ]);
      
      res.json({
        success: true,
        data: {
          users: {
            total: totalUsers,
            verified: verifiedUsers,
            suspended: suspendedUsers
          },
          mentors: {
            total: totalMentors,
            pending: pendingMentors,
            active: activeMentors
          },
          mentees: {
            total: totalMentees
          }
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({
        success: false,
        message: 'Error fetching platform statistics',
        error: error.message
      });
    }
  });

  return router;
};