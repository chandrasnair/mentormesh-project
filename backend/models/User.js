
// User Model
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { 
    type: String, 
    required: [true, 'Full name is required'],
    trim: true,
    minlength: [2, 'Full name must be at least 2 characters'],
    maxlength: [100, 'Full name cannot exceed 100 characters']
  },
  email: { 
    type: String, 
    required: [true, 'Email is required'],
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: { 
    type: String, 
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  roles: {
    type: [String],
    enum: ['mentor', 'mentee', 'admin'],
    required: [true, 'At least one role is required'],
    validate: {
      validator: function(v) { return v && v.length > 0; },
      message: 'At least one role must be selected'
    }
  },
  mentorProfile: {
    skills: { type: [String], default: [] },
    bio: { type: String, trim: true, maxlength: 1000 },
    expertise: { type: String, trim: true },
    experience: { type: Number, min: 0 }
  },
  menteeProfile: {
    interests: { type: [String], default: [] },
    goals: { type: String, trim: true },
    currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    bio: { type: String, trim: true, maxlength: 1000 },
    learningGoals: { type: [String], default: [] }
  },
  isVerified: { type: Boolean, default: false },
  verificationToken: { type: String },
  passwordResetToken: { type: String },
  passwordResetExpires: { type: Date },
  accountStatus: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
  profileCompletion: {
    mentor: { type: Number, default: 0 },
    mentee: { type: Number, default: 0 },
    overall: { type: Number, default: 0 }
  },
  lastLogin: { type: Date }
}, { timestamps: true });

// User methods
userSchema.methods.isMentor = function() {
  return this.roles.includes('mentor');
};

userSchema.methods.isMentee = function() {
  return this.roles.includes('mentee');
};

// Pre-validate
userSchema.pre('validate', function(next) {
  if (this.roles.includes('mentor')) {
    if (!this.mentorProfile.skills || this.mentorProfile.skills.length === 0) {
      this.invalidate('mentorProfile.skills', 'Skills are required for mentors');
    }
    if (!this.mentorProfile.bio || this.mentorProfile.bio.trim().length < 10) {
      this.invalidate('mentorProfile.bio', 'Bio is required for mentors and must be at least 10 characters');
    }
  }
  next();
});

// Calculate profile completion
userSchema.pre('save', function(next) {
  const baseFields = ['fullName', 'email', 'password'];
  let baseCompletion = 0;
  baseFields.forEach(field => {
    if (this[field]) baseCompletion += (100 / 3) / baseFields.length;
  });
  
  if (this.roles.includes('mentor')) {
    let mentorCompletion = baseCompletion;
    const mentorFields = [
      { field: 'skills', weight: 30 },
      { field: 'bio', weight: 30 },
      { field: 'expertise', weight: 20 },
      { field: 'experience', weight: 20 }
    ];
    mentorFields.forEach(({ field, weight }) => {
      const value = this.mentorProfile[field];
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        mentorCompletion += weight;
      }
    });
    this.profileCompletion.mentor = Math.min(100, Math.round(mentorCompletion));
  }
  
  if (this.roles.includes('mentee')) {
    let menteeCompletion = baseCompletion;
    const menteeFields = [
      { field: 'interests', weight: 25 },
      { field: 'goals', weight: 25 },
      { field: 'currentLevel', weight: 20 },
      { field: 'bio', weight: 15 }
    ];
    menteeFields.forEach(({ field, weight }) => {
      const value = this.menteeProfile[field];
      if (value && (Array.isArray(value) ? value.length > 0 : true)) {
        menteeCompletion += weight;
      }
    });
    this.profileCompletion.mentee = Math.min(100, Math.round(menteeCompletion));
  }
  
  const activeProfiles = [];
  if (this.roles.includes('mentor')) activeProfiles.push(this.profileCompletion.mentor);
  if (this.roles.includes('mentee')) activeProfiles.push(this.profileCompletion.mentee);
  
  this.profileCompletion.overall = activeProfiles.length > 0
    ? Math.round(activeProfiles.reduce((a, b) => a + b, 0) / activeProfiles.length)
    : 0;
  
  next();
});

module.exports = mongoose.model('User', userSchema);