const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');
const SessionRequest = require('../models/SessionRequest');

// Auth middleware
const authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Authorization token required' });
    }
    const token = authHeader.split(' ')[1];
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRoles = decoded.roles;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

router.use(authMiddleware);

// Submit feedback for completed session
router.post('/:sessionId', async (req, res) => {
  try {
    const { rating, comment } = req.body;

    const session = await SessionRequest.findOne({
      _id: req.params.sessionId,
      $or: [
        { menteeId: req.userId },
        { mentorId: req.userId }
      ],
      status: 'completed'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or not eligible for feedback'
      });
    }

    // Check if feedback already exists
    const existingFeedback = await Feedback.findOne({
      sessionId: session._id,
      authorId: req.userId
    });

    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        message: 'Feedback already submitted for this session'
      });
    }

    const feedbackData = {
      sessionId: session._id,
      type: 'session',
      authorId: req.userId,
      authorName: req.userEmail, // Will be updated with actual name later
      rating,
      comment,
      approved: true // Auto-approve session feedback for now
    };

    if (req.userId.toString() === session.menteeId.toString()) {
      feedbackData.recipientId = session.mentorId;
      feedbackData.authorRole = 'mentee';
    } else {
      feedbackData.recipientId = session.menteeId;
      feedbackData.authorRole = 'mentor';
    }

    const feedback = new Feedback(feedbackData);
    await feedback.save();

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      feedback
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit feedback'
    });
  }
});

// Get feedback for a session
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await SessionRequest.findById(req.params.sessionId);

    if (!session || (session.menteeId.toString() !== req.userId.toString() && session.mentorId.toString() !== req.userId.toString())) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    const feedback = await Feedback.find({ sessionId: session._id })
      .populate('authorId', 'fullName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      feedback
    });
  } catch (error) {
    console.error('Error fetching session feedback:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch feedback'
    });
  }
});

module.exports = router;
