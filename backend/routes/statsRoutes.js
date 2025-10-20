const express = require('express');
const router = express.Router();
const User = require('../models/User');
const SessionRequest = require('../models/SessionRequest');
const Feedback = require('../models/Feedback');

// Get platform statistics
router.get('/', async (req, res) => {
  try {
    // Get user counts by role
    const totalUsers = await User.countDocuments();
    const mentorCount = await User.countDocuments({ roles: 'mentor', accountStatus: 'active' });
    const menteeCount = await User.countDocuments({ roles: 'mentee', accountStatus: 'active' });

    // Get session statistics
    const totalSessions = await SessionRequest.countDocuments();
    const completedSessions = await SessionRequest.countDocuments({ status: 'completed' });
    const pendingSessions = await SessionRequest.countDocuments({ status: 'pending' });
    const activeSessions = await SessionRequest.countDocuments({ status: 'accepted' });

    // Get average feedback rating
    const allFeedback = await Feedback.find({
      type: 'session',
      approved: true
    });
    const averageRating = allFeedback.length > 0
      ? allFeedback.reduce((sum, fb) => sum + fb.rating, 0) / allFeedback.length
      : 0;

    // Get testimonial count
    const testimonialCount = await Feedback.countDocuments({
      type: 'testimonial',
      approved: true
    });

    // Get sessions completed in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentSessions = await SessionRequest.countDocuments({
      status: 'completed',
      updatedAt: { $gte: thirtyDaysAgo }
    });

    const stats = {
      users: {
        total: totalUsers,
        mentors: mentorCount,
        mentees: menteeCount
      },
      sessions: {
        total: totalSessions,
        completed: completedSessions,
        pending: pendingSessions,
        active: activeSessions,
        recent: recentSessions
      },
      feedback: {
        averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
        totalReviews: allFeedback.length,
        testimonials: testimonialCount
      },
      completionRate: totalSessions > 0 ? Math.round((completedSessions / totalSessions) * 100) : 0
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
});

module.exports = router;
