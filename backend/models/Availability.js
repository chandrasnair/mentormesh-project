// Availability Model
const mongoose = require('mongoose');

const availabilitySchema = new mongoose.Schema({
  mentorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Mentor ID is required'],
    index: true
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    index: true
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Start time must be in HH:MM format']
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'End time must be in HH:MM format']
  },
  isBooked: { type: Boolean, default: false, index: true },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
  status: {
    type: String,
    enum: ['available', 'booked', 'completed', 'cancelled'],
    default: 'available',
    index: true
  },
  meetingLink: { type: String, trim: true },
  notes: { type: String, trim: true, maxlength: 500 },
  timezone: { type: String, default: 'UTC' }
}, { timestamps: true });

availabilitySchema.index({ mentorId: 1, date: 1, isBooked: 1 });
availabilitySchema.index({ date: 1, status: 1 });

availabilitySchema.pre('validate', function(next) {
  if (this.startTime && this.endTime) {
    const [startHour, startMin] = this.startTime.split(':').map(Number);
    const [endHour, endMin] = this.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    if (endMinutes <= startMinutes) {
      this.invalidate('endTime', 'End time must be after start time');
    }
  }
  next();
});

availabilitySchema.methods.book = function(menteeId, bookingId) {
  this.isBooked = true;
  this.bookedBy = menteeId;
  this.bookingId = bookingId;
  this.status = 'booked';
  return this.save();
};

availabilitySchema.methods.cancel = function() {
  this.isBooked = false;
  this.bookedBy = null;
  this.bookingId = null;
  this.status = 'available';
  return this.save();
};

availabilitySchema.methods.complete = function() {
  this.status = 'completed';
  return this.save();
};

module.exports = mongoose.model('Availability', availabilitySchema);