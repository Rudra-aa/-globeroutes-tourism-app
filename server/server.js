const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const Review = require('./models/Review');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/globetrotter';

// Enable CORS so the static client files can query this API
app.use(cors());

// Premium dynamic capacity: increase body limits to easily handle base64 image uploads without payload errors
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Database Connection
console.log(`Connecting to MongoDB at ${MONGODB_URI}...`);
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB.'))
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
    console.log('Server is running, but MongoDB connection failed. Please ensure a MongoDB service is running.');
  });

// API Routes

// 1. Health check to test backend responsiveness
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// 2. Fetch reviews for a specific POI
app.get('/api/reviews/:poiId', async (req, res) => {
  const { poiId } = req.params;
  try {
    const reviews = await Review.find({ poiId }).sort({ date: -1 });
    res.json(reviews);
  } catch (error) {
    console.error(`Error loading reviews for ${poiId}:`, error);
    res.status(500).json({ error: 'Failed to fetch reviews.' });
  }
});

// 3. Post a new review for a POI
app.post('/api/reviews/:poiId', async (req, res) => {
  const { poiId } = req.params;
  const { user, text, stars, image } = req.body;

  if (!user || !text) {
    return res.status(400).json({ error: 'User name and review text are required.' });
  }

  try {
    const newReview = new Review({
      poiId,
      user,
      text,
      stars: Number(stars) || 0,
      image: image || null,
      isUserReview: true,
      date: new Date()
    });

    await newReview.save();
    console.log(`Successfully saved review for POI: ${poiId}`);
    res.status(201).json(newReview);
  } catch (error) {
    console.error(`Error saving review for ${poiId}:`, error);
    res.status(500).json({ error: 'Failed to save review to database.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`Globetrotter Backend running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
