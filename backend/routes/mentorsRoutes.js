// routes/mentorsRoutes.js
const express = require('express');
const router = express.Router();
const User = require('../models/User'); // Assuming the model is in this path

module.exports = () => {
  // Search for mentors by name or skills
  router.get('/search', async (req, res) => {
    try {
      const { q } = req.query;

      if (!q || q.trim() === '') {
        return res.json({ success: true, data: { mentors: [] } });
      }

      const searchQuery = {
        roles: 'mentor',
        accountStatus: 'active', // Only search for active mentors
        $or: [
          { fullName: { $regex: q, $options: 'i' } }, // Case-insensitive name search
          { 'mentorProfile.skills': { $regex: q, $options: 'i' } }, // Case-insensitive skill search
          { 'mentorProfile.expertise': { $regex: q, $options: 'i' } }
        ]
      };

      const mentors = await User.find(searchQuery).select(
        'fullName mentorProfile'
      );

      res.json({
        success: true,
        data: { mentors }
      });

    } catch (error) {
      console.error('Mentor search error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while searching for mentors'
      });
    }
  });

  // Get featured mentors
  router.get('/featured', async (req, res) => {
    try {
      // CRITICAL FIX: Parse the limit from query string into a number.
      // Default to 3 if it's not a valid number.
      const limit = parseInt(req.query.limit, 10) || 3;

      const featuredMentors = await User.find({
        roles: 'mentor',
        accountStatus: 'active'
      })
      .sort({ 'mentorProfile.sessionsCompleted': -1, 'mentorProfile.rating': -1 }) // Example sorting
      .limit(limit)
      .select('fullName mentorProfile');

      res.json({ success: true, data: { mentors: featuredMentors } });

    } catch (error) {
      console.error('Error fetching featured mentors:', error);
      res.status(500).json({ success: false, message: 'Server error while fetching featured mentors' });
    }
  });

  return router;
};