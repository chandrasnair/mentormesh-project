const express = require('express');
const router = express.Router();
const Feedback = require('../models/Feedback');

// Get all approved testimonials
router.get('/', async (req, res) => {
  try {
    const testimonials = await Feedback.find({
      type: 'testimonial',
      approved: true
    })
      .populate('authorId', 'fullName mentorProfile.bio menteeProfile.bio')
      .populate('recipientId', 'fullName')
      .sort({ createdAt: -1 });

    const formatted = testimonials.map(t => ({
      id: t._id,
      title: t.title,
      comment: t.comment,
      rating: t.rating,
      authorName: t.authorName || (t.authorId ? t.authorId.fullName : 'Anonymous'),
      authorRole: t.authorRole,
      recipientName: t.recipientId ? t.recipientId.fullName : null,
      createdAt: t.createdAt,
      isFeatured: t.isFeatured,
      tags: t.tags
    }));

    res.json({
      success: true,
      testimonials: formatted
    });
  } catch (error) {
    console.error('Error fetching testimonials:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch testimonials'
    });
  }
});

module.exports = router;
