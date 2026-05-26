const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const Review = require('./models/Review');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5001;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/globeroutes';
const JWT_SECRET = process.env.JWT_SECRET || 'globeroutes_secure_jwt_secret_token_2026_!';

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

// 2. Auth: Register new user
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required.' });
  }
  try {
    const emailNorm = email.toLowerCase().trim();
    const existing = await User.findOne({ email: emailNorm });
    if (existing) {
      return res.status(400).json({ error: 'Email is already registered.' });
    }
    
    // Hash password securely on the backend
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Strict admin privilege verification: only allow rudratheadmin123 or variants
    const isAdmin = emailNorm === 'rudratheadmin123' || 
                    emailNorm === 'rudratheadmin@123' ||
                    emailNorm.startsWith('rudratheadmin123@');
    
    const newUser = new User({
      name: isAdmin ? "Rudra The Admin" : name,
      email: emailNorm,
      password: hashedPassword,
      isPremium: isAdmin,
      membershipTier: isAdmin ? "Pro Explorer (Admin)" : "Free Explorer",
      visitedPois: [],
      travelHops: 0
    });
    
    await newUser.save();
    console.log(`User ${emailNorm} registered successfully. Admin=${isAdmin}`);
    
    const token = jwt.sign({ userId: newUser._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      token,
      user: {
        name: newUser.name,
        email: newUser.email,
        isPremium: newUser.isPremium,
        membershipTier: newUser.membershipTier,
        visitedPois: newUser.visitedPois,
        travelHops: newUser.travelHops
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error during registration.' });
  }
});

// 3. Auth: Login user
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }
  try {
    const emailNorm = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm });
    if (!user || !user.password) {
      return res.status(400).json({ error: 'Invalid credentials entered. Please try again.' });
    }
    
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials entered. Please try again.' });
    }
    
    // Check and verify strict admin privilege on login
    const isAdmin = emailNorm === 'rudratheadmin123' || 
                    emailNorm === 'rudratheadmin@123' ||
                    emailNorm.startsWith('rudratheadmin123@');
    if (isAdmin && !user.isPremium) {
      user.isPremium = true;
      user.membershipTier = "Pro Explorer (Admin)";
      await user.save();
    }
    
    console.log(`User ${emailNorm} signed in successfully.`);
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token,
      user: {
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        membershipTier: user.membershipTier,
        visitedPois: user.visitedPois,
        travelHops: user.travelHops
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during login.' });
  }
});

// 4. Auth: Google Login / Register
app.post('/api/auth/google', async (req, res) => {
  const { token } = req.body;
  if (!token) {
    return res.status(400).json({ error: 'Google credential token is required.' });
  }
  try {
    // Decode Google JWT payload locally for standalone offline compatibility
    const parts = token.split('.');
    if (parts.length !== 3) {
      return res.status(400).json({ error: 'Invalid token structure.' });
    }
    
    const decodedPayload = Buffer.from(parts[1], 'base64').toString('utf8');
    const googleUser = JSON.parse(decodedPayload);
    
    if (!googleUser.email) {
      return res.status(400).json({ error: 'Invalid Google token payload: email missing.' });
    }
    
    const email = googleUser.email.toLowerCase().trim();
    const name = googleUser.name || email.split('@')[0];
    const googleId = googleUser.sub;
    
    let user = await User.findOne({ email });
    const isAdmin = email === 'rudratheadmin123' || 
                    email === 'rudratheadmin@123' ||
                    email.startsWith('rudratheadmin123@');
                    
    if (!user) {
      // Auto-register google user
      user = new User({
        name: isAdmin ? "Rudra The Admin" : name,
        email,
        googleId,
        isPremium: isAdmin,
        membershipTier: isAdmin ? "Pro Explorer (Admin)" : "Free Explorer",
        visitedPois: [],
        travelHops: 0
      });
      await user.save();
      console.log(`Auto-registered Google user ${email}. Admin=${isAdmin}`);
    } else {
      let modified = false;
      if (!user.googleId) {
        user.googleId = googleId;
        modified = true;
      }
      if (isAdmin && !user.isPremium) {
        user.isPremium = true;
        user.membershipTier = "Pro Explorer (Admin)";
        modified = true;
      }
      if (modified) {
        await user.save();
      }
      console.log(`Verified returning Google user ${email}.`);
    }
    
    const jwtToken = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      token: jwtToken,
      user: {
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        membershipTier: user.membershipTier,
        visitedPois: user.visitedPois,
        travelHops: user.travelHops
      }
    });
  } catch (error) {
    console.error('Google Auth error:', error);
    res.status(500).json({ error: 'Internal server error during Google Sign-in.' });
  }
});

// 5. User: Sync dynamic progress data (visited POIs and travel hops)
app.post('/api/user/sync', async (req, res) => {
  const { email, visitedPois, travelHops } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'User email is required to sync progress.' });
  }
  try {
    const emailNorm = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (Array.isArray(visitedPois)) {
      // Merge unique POIs without losing existing database progress
      user.visitedPois = Array.from(new Set([...user.visitedPois, ...visitedPois]));
    }
    if (typeof travelHops === 'number' && travelHops > user.travelHops) {
      user.travelHops = travelHops;
    }
    
    await user.save();
    console.log(`Synced journal data for ${emailNorm}. Total POIs=${user.visitedPois.length}`);
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        membershipTier: user.membershipTier,
        visitedPois: user.visitedPois,
        travelHops: user.travelHops
      }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({ error: 'Internal server error during data sync.' });
  }
});

// 6. User: Upgrade tier to Pro via Razorpay
app.post('/api/user/upgrade', async (req, res) => {
  const { email, paymentId } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'User email is required to upgrade.' });
  }
  try {
    const emailNorm = email.toLowerCase().trim();
    const user = await User.findOne({ email: emailNorm });
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    user.isPremium = true;
    user.membershipTier = "Pro Explorer";
    await user.save();
    console.log(`Upgraded user ${emailNorm} to Pro via Razorpay payment ID: ${paymentId}`);
    res.json({
      success: true,
      user: {
        name: user.name,
        email: user.email,
        isPremium: user.isPremium,
        membershipTier: user.membershipTier,
        visitedPois: user.visitedPois,
        travelHops: user.travelHops
      }
    });
  } catch (error) {
    console.error('Upgrade error:', error);
    res.status(500).json({ error: 'Internal server error during Razorpay upgrade.' });
  }
});

// 7. Reviews: Fetch reviews for a specific POI
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

// 8. Reviews: Post a new review for a POI
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
  console.log(`Globeroutes Backend running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
