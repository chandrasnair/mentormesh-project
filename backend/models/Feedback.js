const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['testimonial', 'session'],
    required: true,
    index: true
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  authorRole: {
    type: String,
    required: true,
    enum: ['mentor', 'mentee']
  },
  authorName: {
    type: String,
    required: true,
    trim: true
  },
  recipientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SessionRequest'
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: 100,
    required: function() { return this.type === 'testimonial'; }
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },
  approved: {
    type: Boolean,
    default: false,
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, { timestamps: true });

feedbackSchema.index({ type: 1, approved: 1, isFeatured: -1 });

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
