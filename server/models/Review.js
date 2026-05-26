const mongoose = require('mongoose');

const ReviewSchema = new mongoose.Schema({
  poiId: { 
    type: String, 
    required: true, 
    index: true // index for ultra-fast queries when scaling to many reviews
  },
  user: { 
    type: String, 
    required: true 
  },
  text: { 
    type: String, 
    required: true 
  },
  stars: { 
    type: Number, 
    default: 0, 
    min: 0, 
    max: 5 
  },
  image: { 
    type: String // holds the optional base64 representation of uploaded review photo
  },
  isUserReview: { 
    type: Boolean, 
    default: true 
  },
  date: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('Review', ReviewSchema);
