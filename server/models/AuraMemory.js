const mongoose = require('mongoose');

// ==========================================
// User Preferences Collection
// ==========================================
const userPreferencesSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  homeCity: { type: String, default: null },
  transportPreference: { type: String, enum: ['flight', 'train', 'road', null], default: null },
  hotelPreference: { type: String, enum: ['luxury', 'budget', 'hostel', 'resort', null], default: null },
  travelStyle: { type: String, enum: ['relaxed', 'adventure', 'cultural', 'party', null], default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// Trip Memory Collection
// ==========================================
const tripMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  tripId: { type: String, unique: true, required: true },
  status: { type: String, enum: ['planning', 'booked', 'completed'], default: 'planning' },
  sourceCity: String,
  destinationCity: String,
  budget: Number,
  travelers: Number,
  durationDays: Number,
  startDate: Date,
  itinerary: { type: mongoose.Schema.Types.Mixed },
  savedRoutes: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ==========================================
// Conversation Memory Collection
// ==========================================
const conversationMemorySchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  sessionId: { type: String, required: true, index: true },
  contextSnapshot: {
    sourceCity: String,
    destination: String,
    budget: Number,
    travelers: Number,
    duration: Number,
    transportPreference: String,
    intent: String
  },
  messages: [{
    role: { type: String, enum: ['user', 'aura'] },
    content: String,
    timestamp: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, expires: '7d', default: () => Date.now() + 7*24*60*60*1000 } // Session expires after 7 days
});

// Middleware to update timestamps
userPreferencesSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

tripMemorySchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = {
  UserPreferences: mongoose.model('UserPreferences', userPreferencesSchema),
  TripMemory: mongoose.model('TripMemory', tripMemorySchema),
  ConversationMemory: mongoose.model('ConversationMemory', conversationMemorySchema)
};
