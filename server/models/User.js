const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    index: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String
  },
  googleId: {
    type: String
  },
  isPremium: {
    type: Boolean,
    default: false
  },
  membershipTier: {
    type: String,
    default: 'Free Explorer'
  },
  visitedPois: {
    type: [String],
    default: []
  },
  travelHops: {
    type: Number,
    default: 0
  },
  dateCreated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
