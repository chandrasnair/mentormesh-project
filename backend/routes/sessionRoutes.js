const express = require('express');
const router = express.Router();
const SessionRequest = require('../models/SessionRequest');
const User = require('../models/User');
const Feedback = require('../models/Feedback');

// Middleware to check role
const checkMenteeRole = (req, res, next) => {
  if (!req.userRoles.includes('mentee')) {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to mentees'
    });
  }
  next();
};

const checkMentorRole = (req, res, next) => {
  if (!req.userRoles.includes('mentor')) {
    return res.status(403).json({
      success: false,
      message: 'Access restricted to mentors'
    });
  }
  next();
};

// Auth middleware - pasted here for convenience
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

// Apply auth to all routes
router.use(authMiddleware);

// Create session request (mentee)
router.post('/request', checkMenteeRole, async (req, res) => {
  try {
    const { mentorId, skill, description, preferredDate, preferredTime, duration } = req.body;

    const requestData = {
      menteeId: req.userId,
      mentorId,
      skill, // Use 'skill' to match the frontend request
      description,
      preferredDate: new Date(preferredDate),
      preferredTime,
      duration,
      status: 'pending'
    };

    const request = new SessionRequest(requestData);
    await request.save();

    res.status(201).json({
      success: true,
      message: 'Session request sent successfully',
      request: request
    });
  } catch (error) {
    console.error('Error creating session request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session request'
    });
  }
});

// Get mentor's incoming session requests
router.get('/requests/mentor', checkMentorRole, async (req, res) => {
  try {
    const status = req.query.status || null;

    const query = { mentorId: req.userId };
    if (status) query.status = status;

    const requests = await SessionRequest.find(query)
      .populate('menteeId', 'fullName email menteeProfile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching mentor requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// Get mentee's outgoing session requests
router.get('/requests/mentee', checkMenteeRole, async (req, res) => {
  try {
    const requests = await SessionRequest.find({ menteeId: req.userId })
      .populate('mentorId', 'fullName email mentorProfile')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      requests: requests
    });
  } catch (error) {
    console.error('Error fetching mentee requests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch requests'
    });
  }
});

// Accept session request (mentor)
router.post('/:requestId/accept', checkMentorRole, async (req, res) => {
  try {
    const { meetingLink } = req.body;

    const request = await SessionRequest.findOne({
      _id: req.params.requestId,
      mentorId: req.userId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found or already processed'
      });
    }

    request.status = 'accepted';
    request.scheduledDate = request.preferredDate;
    request.scheduledTime = request.preferredTime;
    if (meetingLink) request.meetingLink = meetingLink;

    await request.save();

    res.json({
      success: true,
      message: 'Session request accepted',
      request
    });
  } catch (error) {
    console.error('Error accepting request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to accept request'
    });
  }
});

// Decline session request (mentor)
router.post('/:requestId/decline', checkMentorRole, async (req, res) => {
  try {
    const { reason } = req.body;

    const request = await SessionRequest.findOne({
      _id: req.params.requestId,
      mentorId: req.userId,
      status: 'pending'
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Request not found'
      });
    }

    request.status = 'declined';
    request.cancellationReason = reason;

    await request.save();

    res.json({
      success: true,
      message: 'Session request declined'
    });
  } catch (error) {
    console.error('Error declining request:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline request'
    });
  }
});

// Get mentor's scheduled sessions
router.get('/sessions/mentor', checkMentorRole, async (req, res) => {
  try {
    const includePast = req.query.includePast === 'true';

    const query = {
      mentorId: req.userId,
      status: {
        $in: includePast ? ['accepted', 'pending', 'completed'] : ['accepted', 'pending']
      }
    };

    const requests = await SessionRequest.find(query)
      .populate('menteeId', 'fullName email menteeProfile')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.json({
      success: true,
      sessions: requests
    });
  } catch (error) {
    console.error('Error fetching mentor sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
});

// Get mentee's booked sessions
router.get('/sessions/mentee', checkMenteeRole, async (req, res) => {
  try {
    const includePast = req.query.includePast === 'true';

    const query = {
      menteeId: req.userId,
      status: {
        $in: includePast ? ['accepted', 'pending', 'completed'] : ['accepted']
      }
    };

    const requests = await SessionRequest.find(query)
      .populate('mentorId', 'fullName email mentorProfile')
      .sort({ scheduledDate: 1, scheduledTime: 1 });

    res.json({
      success: true,
      sessions: requests
    });
  } catch (error) {
    console.error('Error fetching mentee sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
});

// Cancel session
router.post('/:sessionId/cancel', async (req, res) => {
  try {
    const { reason } = req.body;

    const session = await SessionRequest.findOne({
      _id: req.params.sessionId,
      $or: [
        { menteeId: req.userId },
        { mentorId: req.userId }
      ],
      status: { $in: ['pending', 'accepted'] }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found or cannot be cancelled'
      });
    }

    session.status = 'cancelled';
    session.cancellationReason = reason;

    await session.save();

    res.json({
      success: true,
      message: 'Session cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel session'
    });
  }
});

// Complete session (mentor)
router.post('/:sessionId/complete', checkMentorRole, async (req, res) => {
  try {
    const session = await SessionRequest.findOne({
      _id: req.params.sessionId,
      mentorId: req.userId,
      status: 'accepted'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.status = 'completed';

    // Create feedback object
    const feedback = new Feedback({
      sessionId: session._id,
      type: 'session',
      authorId: session.menteeId,
      recipientId: session.mentorId
    });

    await session.save();

    res.json({
      success: true,
      message: 'Session marked as complete',
      session
    });
  } catch (error) {
    console.error('Error completing session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete session'
    });
  }
});

// Reschedule session (mentor)
router.put('/:sessionId/reschedule', checkMentorRole, async (req, res) => {
  try {
    const { newDate, newTime, reason } = req.body;

    const session = await SessionRequest.findOne({
      _id: req.params.sessionId,
      mentorId: req.userId,
      status: 'accepted'
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    session.scheduledDate = new Date(newDate);
    session.scheduledTime = newTime;
    session.rescheduleReason = reason;

    await session.save();

    res.json({
      success: true,
      message: 'Session rescheduled',
      session
    });
  } catch (error) {
    console.error('Error rescheduling session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reschedule session'
    });
  }
});

// Get meeting details
router.get('/:sessionId/meeting', async (req, res) => {
  try {
    const session = await SessionRequest.findOne({
      _id: req.params.sessionId,
      $or: [
        { menteeId: req.userId },
        { mentorId: req.userId }
      ]
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found'
      });
    }

    res.json({
      success: true,
      meeting: {
        id: session._id,
        topic: session.topic,
        scheduledDate: session.scheduledDate,
        scheduledTime: session.scheduledTime,
        duration: session.duration,
        meetingLink: session.meetingLink,
        status: session.status,
        notes: session.notes
      }
    });
  } catch (error) {
    console.error('Error fetching meeting details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch meeting details'
    });
  }
});

module.exports = router;
