// routes/feedbackRoutes.js
// Feedback management routes

const express = require('express');
const router = express.Router();

module.exports = (Feedback, User, Availability, mongoose) => {

  // Submit feedback
  router.post('/submit', async (req, res) => {
    try {
      const { 
        sessionId, 
        mentorId, 
        mentorName,
        rating, 
        comments, 
        isAnonymous 
      } = req.body;
      
      const studentId = req.userId;

      console.log('Checking student access to feedback:', feedbackId);

      // Validate required fields
      if (!sessionId || !mentorId || !mentorName || !rating) {
        return res.status(400).json({ 
          success: false, 
          message: 'Session ID, Mentor ID, Mentor Name, and Rating are required' 
        });
      }
      // Validate rating range
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ 
          success: false, 
          message: 'Rating must be between 1 and 5' 
        });
      }

      // Check if the availability slot exists and is completed
      const availabilitySlot = await Availability.findById(sessionId);
      
      if (!availabilitySlot) {
        return res.status(404).json({
          success: false,
          message: 'Session not found'
        });
      }

      if (availabilitySlot.status !== 'completed') {
        return res.status(400).json({
          success: false,
          message: 'Feedback can only be submitted for completed sessions'
        });
      }

      // Verify that the student was the one who booked this slot
      if (availabilitySlot.bookedBy.toString() !== studentId) {
        return res.status(403).json({
          success: false,
          message: 'You can only submit feedback for sessions you attended'
        });
      }

      // Check if feedback already exists for this session
      const existingFeedback = await Feedback.findOne({ sessionId, studentId });
      
      if (existingFeedback) {
        return res.status(400).json({ 
          success: false, 
          message: 'You have already submitted feedback for this session' 
        });
      }

      // Get user information
      const user = await User.findById(studentId).select('fullName email');
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'User not found'
        });
      }

      // Create new feedback
      const feedback = new Feedback({
        sessionId,
        studentId,
        studentName: isAnonymous ? 'Anonymous Student' : user.fullName,
        studentEmail: user.email,
        mentorId,
        mentorName,
        rating,
        comments: comments || '',
        isAnonymous: isAnonymous || false
      });

      await feedback.save();

      console.log('Feedback submitted successfully for session:', sessionId);

      res.status(201).json({
        success: true,
        message: 'Feedback submitted successfully',
        data: {
          feedbackId: feedback._id,
          rating: feedback.rating,
          createdAt: feedback.createdAt
        }
      });

    } catch (error) {
      console.error('Error submitting feedback:', error);
      
      if (error.code === 11000) {
        return res.status(400).json({ 
          success: false, 
          message: 'Feedback already exists for this session' 
        });
      }
      
      res.status(500).json({ 
        success: false, 
        message: 'Server error while submitting feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Get feedback for a specific mentor
  router.get('/mentor/:mentorId', async (req, res) => {
    try {
      const { mentorId } = req.params;
      const { limit, includeAnonymous } = req.query;

      console.log('Fetching feedback for mentor:', mentorId);

      const query = { mentorId: new mongoose.Types.ObjectId(mentorId) };
      
      let feedbacks = await Feedback.find(query)
        .sort({ createdAt: -1 })
        .limit(limit ? parseInt(limit) : 0);

      // Hide student info for anonymous feedback
      feedbacks = feedbacks.map(fb => {
        const feedbackObj = fb.toObject();
        if (feedbackObj.isAnonymous && includeAnonymous !== 'true') {
          feedbackObj.studentName = 'Anonymous';
          feedbackObj.studentEmail = 'hidden';
        }
        return feedbackObj;
      });

      // Calculate statistics
      const totalFeedbacks = feedbacks.length;
      const totalRating = feedbacks.reduce((sum, fb) => sum + fb.rating, 0);
      const averageRating = totalFeedbacks > 0 
        ? parseFloat((totalRating / totalFeedbacks).toFixed(2))
        : 0;

      // Rating distribution
      const ratingDistribution = {
        5: feedbacks.filter(fb => fb.rating === 5).length,
        4: feedbacks.filter(fb => fb.rating === 4).length,
        3: feedbacks.filter(fb => fb.rating === 3).length,
        2: feedbacks.filter(fb => fb.rating === 2).length,
        1: feedbacks.filter(fb => fb.rating === 1).length
      };

      console.log(`Found ${totalFeedbacks} feedbacks for mentor ${mentorId}`);

      res.status(200).json({
        success: true,
        data: {
          feedbacks,
          statistics: {
            totalFeedbacks,
            averageRating,
            ratingDistribution
          }
        }
      });

    } catch (error) {
      console.error('Error fetching mentor feedback:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Check if feedback exists for a session
  router.get('/session/:sessionId', async (req, res) => {
    try {
      const { sessionId } = req.params;
      const studentId = req.userId; // Getting userId directly from auth middleware

      console.log('Checking feedback for session:', sessionId);

      const feedback = await Feedback.findOne({ 
        sessionId: new mongoose.Types.ObjectId(sessionId), 
        studentId: new mongoose.Types.ObjectId(studentId)
      });

      res.status(200).json({
        success: true,
        data: {
          feedbackExists: !!feedback,
          feedback: feedback || null
        }
      });

    } catch (error) {
      console.error('Error checking feedback:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while checking feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Get feedback statistics for admin dashboard
  router.get('/stats', async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Admin only.' 
        });
      }

      console.log('Fetching feedback statistics for admin');

      // Overall statistics
      const totalFeedbacks = await Feedback.countDocuments();
      const allFeedbacks = await Feedback.find();
      
      const totalRating = allFeedbacks.reduce((sum, fb) => sum + fb.rating, 0);
      const overallAverageRating = totalFeedbacks > 0 
        ? parseFloat((totalRating / totalFeedbacks).toFixed(2))
        : 0;

      // Mentor-wise statistics
      const mentorStats = await Feedback.aggregate([
        {
          $group: {
            _id: '$mentorId',
            mentorName: { $first: '$mentorName' },
            totalFeedbacks: { $sum: 1 },
            averageRating: { $avg: '$rating' },
            ratingsSum: { $sum: '$rating' }
          }
        },
        {
          $project: {
            mentorId: '$_id',
            mentorName: 1,
            totalFeedbacks: 1,
            averageRating: { $round: ['$averageRating', 2] }
          }
        },
        {
          $sort: { averageRating: -1 }
        }
      ]);

      // Recent feedback
      const recentFeedback = await Feedback.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('rating comments mentorName studentName createdAt isAnonymous');

      console.log('Statistics fetched successfully');

      res.status(200).json({
        success: true,
        data: {
          overall: {
            totalFeedbacks,
            averageRating: overallAverageRating
          },
          mentorStats,
          recentFeedback
        }
      });

    } catch (error) {
      console.error('Error fetching feedback stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Get student's own feedback history
  router.get('/my-feedback', async (req, res) => {
    try {
      const studentId = req.userId;

      console.log('Fetching feedback history for student:', studentId);

      const feedbacks = await Feedback.find({ 
        studentId: new mongoose.Types.ObjectId(studentId) 
      })
        .sort({ createdAt: -1 });

      res.status(200).json({
        success: true,
        data: {
          feedbacks,
          totalSubmitted: feedbacks.length
        }
      });

    } catch (error) {
      console.error('Error fetching student feedback:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while fetching feedback history',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Update feedback (within 24 hours)
  router.put('/:feedbackId', async (req, res) => {
    try {
      const { feedbackId } = req.params;
      const { rating, comments } = req.body;
      const studentId = req.userId;

      console.log('Feedback update attempt:', feedbackId);

      const feedback = await Feedback.findById(feedbackId);

      if (!feedback) {
        return res.status(404).json({ 
          success: false, 
          message: 'Feedback not found' 
        });
      }

      // Check if feedback belongs to the user
      if (feedback.studentId.toString() !== studentId) {
        return res.status(403).json({ 
          success: false, 
          message: 'You can only update your own feedback' 
        });
      }

      // Check if feedback is within 24 hours
      const hoursSinceCreation = (Date.now() - feedback.createdAt) / (1000 * 60 * 60);
      if (hoursSinceCreation > 24) {
        return res.status(400).json({ 
          success: false, 
          message: 'Feedback can only be updated within 24 hours of submission' 
        });
      }

      // Update fields
      if (rating !== undefined) {
        if (rating < 1 || rating > 5) {
          return res.status(400).json({ 
            success: false, 
            message: 'Rating must be between 1 and 5' 
          });
        }
        feedback.rating = rating;
      }

      if (comments !== undefined) {
        feedback.comments = comments;
      }

      await feedback.save();

      console.log('Feedback updated successfully:', feedbackId);

      res.status(200).json({
        success: true,
        message: 'Feedback updated successfully',
        data: feedback
      });

    } catch (error) {
      console.error('Error updating feedback:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while updating feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // Delete feedback (Admin only)
  router.delete('/:feedbackId', async (req, res) => {
    try {
      if (!req.userRoles || !req.userRoles.includes('admin')) {
        return res.status(403).json({ 
          success: false, 
          message: 'Access denied. Admin only.' 
        });
      }

      const { feedbackId } = req.params;

      console.log('Deleting feedback:', feedbackId);

      const feedback = await Feedback.findByIdAndDelete(feedbackId);

      if (!feedback) {
        return res.status(404).json({ 
          success: false, 
          message: 'Feedback not found' 
        });
      }

      console.log('Feedback deleted successfully:', feedbackId);

      res.status(200).json({
        success: true,
        message: 'Feedback deleted successfully'
      });

    } catch (error) {
      console.error('Error deleting feedback:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server error while deleting feedback',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  return router;
};