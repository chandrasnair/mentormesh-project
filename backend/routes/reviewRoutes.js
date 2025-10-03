// routes/reviewRoutes.js
const express = require('express');
const router = express.Router();

module.exports = (Review, User, authMiddleware) => {

  // Submit review (protected - only verified mentors/mentees)
  router.post('/', authMiddleware, async (req, res) => {
    try {
      const { name, role, comment, rating } = req.body;

      // Validation
      if (!name || !role || !comment) {
        return res.status(400).json({
          success: false,
          message: 'Name, role, and comment are required'
        });
      }

      if (!['mentor', 'mentee'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Role must be either mentor or mentee'
        });
      }

      if (comment.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: 'Comment must be at least 10 characters'
        });
      }

      if (comment.trim().length > 1000) {
        return res.status(400).json({
          success: false,
          message: 'Comment cannot exceed 1000 characters'
        });
      }

      // Verify user exists and is verified
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      if (!user.isVerified) {
        return res.status(403).json({
          success: false,
          message: 'Only verified users can submit reviews'
        });
      }

      // Check if user has the role they're submitting review for
      if (!user.roles.includes(role)) {
        return res.status(403).json({
          success: false,
          message: `You must have the ${role} role to submit a review as a ${role}`
        });
      }

      // Create review
      const review = new Review({
        userId: req.userId,
        name: name.trim(),
        role,
        comment: comment.trim(),
        rating: rating ? Number(rating) : undefined
      });

      await review.save();

      res.status(201).json({
        success: true,
        message: 'Review submitted successfully',
        data: { review }
      });

    } catch (error) {
      console.error('Submit review error:', error);
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      res.status(500).json({
        success: false,
        message: 'Server error while submitting review'
      });
    }
  });

  // Get user's own reviews (protected)
  router.get('/my-reviews', authMiddleware, async (req, res) => {
    try {
      const reviews = await Review.find({ userId: req.userId })
        .sort({ createdAt: -1 });

      res.json({
        success: true,
        data: {
          count: reviews.length,
          reviews
        }
      });

    } catch (error) {
      console.error('Get user reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching reviews'
      });
    }
  });

  // Get all reviews (admin only - optional, for now get all)
  router.get('/all', async (req, res) => {
    try {
      const { role, status, limit = 50 } = req.query;

      const query = {};
      if (role) query.role = role;
      if (status) query.status = status;

      const reviews = await Review.find(query)
        .populate('userId', 'fullName email roles')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: {
          count: reviews.length,
          reviews
        }
      });

    } catch (error) {
      console.error('Get all reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching reviews'
      });
    }
  });

  // Get public reviews (for testimonials/reviews page)
  router.get('/public', async (req, res) => {
    try {
      const { role, limit = 10 } = req.query;

      const query = { isPublic: true };
      if (role) query.role = role;

      const reviews = await Review.find(query)
        .select('name role comment rating createdAt')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: {
          count: reviews.length,
          reviews
        }
      });

    } catch (error) {
      console.error('Get public reviews error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching public reviews'
      });
    }
  });

  // Update review status (admin only - for now anyone can update)
  router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const { status, adminResponse, isPublic } = req.body;

      const review = await Review.findById(id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      if (status) review.status = status;
      if (adminResponse !== undefined) review.adminResponse = adminResponse;
      if (isPublic !== undefined) review.isPublic = isPublic;

      await review.save();

      res.json({
        success: true,
        message: 'Review updated successfully',
        data: { review }
      });

    } catch (error) {
      console.error('Update review error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while updating review'
      });
    }
  });

  // Delete review (user can delete their own)
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const { id } = req.params;

      const review = await Review.findById(id);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found'
        });
      }

      // Check if user owns this review
      if (review.userId.toString() !== req.userId) {
        return res.status(403).json({
          success: false,
          message: 'You can only delete your own reviews'
        });
      }

      await Review.findByIdAndDelete(id);

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });

    } catch (error) {
      console.error('Delete review error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while deleting review'
      });
    }
  });

  // Get review statistics
  router.get('/stats', async (req, res) => {
    try {
      const totalReviews = await Review.countDocuments();
      const mentorReviews = await Review.countDocuments({ role: 'mentor' });
      const menteeReviews = await Review.countDocuments({ role: 'mentee' });
      const pendingReviews = await Review.countDocuments({ status: 'pending' });
      const publicReviews = await Review.countDocuments({ isPublic: true });

      // Average rating
      const ratingsData = await Review.aggregate([
        { $match: { rating: { $exists: true, $ne: null } } },
        {
          $group: {
            _id: null,
            averageRating: { $avg: '$rating' },
            totalRatings: { $sum: 1 }
          }
        }
      ]);

      const averageRating = ratingsData.length > 0 
        ? ratingsData[0].averageRating.toFixed(1)
        : 0;

      res.json({
        success: true,
        data: {
          totalReviews,
          mentorReviews,
          menteeReviews,
          pendingReviews,
          publicReviews,
          averageRating,
          totalRatings: ratingsData.length > 0 ? ratingsData[0].totalRatings : 0
        }
      });

    } catch (error) {
      console.error('Get review stats error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error while fetching review statistics'
      });
    }
  });

  return router;
};

module.exports;