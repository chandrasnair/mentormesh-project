const mongoose = require('mongoose');

const sessionRequestSchema = new mongoose.Schema({
  menteeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  topic: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  preferredDate: {
    type: Date,
    required: true
  },
  preferredTime: {
    type: String,
    required: true,
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format']
  },
  duration: {
    type: Number,
    required: true,
    min: 30,
    max: 120 // 30 minutes to 2 hours
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'declined', 'cancelled', 'completed', 'rescheduled'],
    default: 'pending',
    index: true
  },
  meetingLink: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  scheduledDate: Date,
  scheduledTime: String,
  rescheduleReason: String,
  cancellationReason: String,
  feedback: {
    rating: { type: Number, min: 1, max: 5 },
    comment: { type: String, trim: true, maxlength: 1000 },
    submittedAt: Date
  }
}, { timestamps: true });

sessionRequestSchema.index({ menteeId: 1, status: 1 });
sessionRequestSchema.index({ mentorId: 1, status: 1 });
sessionRequestSchema.index({ status: 1, preferredDate: 1 });

sessionRequestSchema.pre('validate', function(next) {
  if (this.status === 'completed' && !this.feedback) {
    this.invalidate('feedback', 'Feedback is required for completed sessions');
  }
  next();
});

const SessionRequest = mongoose.model('SessionRequest', sessionRequestSchema);

module.exports = SessionRequest;
