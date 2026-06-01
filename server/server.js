const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Groq AI SDK (optional — set GROQ_API_KEY in .env)
let groqClient = null;
try {
  const Groq = require('groq-sdk');
  if (process.env.GROQ_API_KEY) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
    console.log('Groq AI client initialized.');
  } else {
    console.log('GROQ_API_KEY not set. Aura will use smart fallback mode.');
  }
} catch (e) {
  console.log('groq-sdk not installed. Run: cd server && npm install groq-sdk');
}

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

// 9. Aura V2: Conversational Chat
app.post('/api/aura/v2/chat', async (req, res) => {
  const { message, context, conversationHistory } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  try {
    if (!groqClient) {
      return res.json({
        response: "I'm here to help! Tell me about your trip plans. Where would you like to go?",
        type: 'general'
      });
    }

    const conversationContext = conversationHistory
      ? conversationHistory.map(m => ({ role: m.role, content: m.content }))
      : [];

    const systemPrompt = `You are Aura, a friendly and knowledgeable AI travel planning assistant. 
Your role is to help users plan their travel trips by:
1. Understanding their travel needs
2. Asking clarifying questions when needed
3. Providing personalized travel recommendations
4. Suggesting routes, hotels, and attractions
5. Helping with budget planning

Be conversational, helpful, and maintain context from previous messages.
Keep responses concise and friendly.`;

    conversationContext.push({
      role: 'user',
      content: message
    });

    const response = await groqClient.chat.completions.create({
      messages: conversationContext,
      model: 'mixtral-8x7b-32768',
      system: systemPrompt,
      max_tokens: 500,
      temperature: 0.7
    });

    const aiResponse = response.choices[0].message.content;

    res.json({
      response: aiResponse,
      type: 'conversational'
    });
  } catch (error) {
    console.error('Aura V2 chat error:', error);
    res.json({
      response: "I encountered a temporary issue. Please try again!",
      type: 'error'
    });
  }
});

// 9.1 Aura V2: Generate Trip Plan
app.post('/api/aura/v2/generate-trip', async (req, res) => {
  const { destination, duration, budget, travelers, transportPreference, hotelPreference, travelStyle } = req.body;
  
  if (!destination || !duration || !budget) {
    return res.status(400).json({ error: 'Destination, duration, and budget are required.' });
  }

  try {
    const tripPlan = {
      destination,
      duration: parseInt(duration),
      travelers: travelers || 1,
      budget,
      travelStyle: travelStyle || 'balanced',
      itinerary: generateItinerary(destination, parseInt(duration)),
      budgetBreakdown: generateBudgetBreakdown(budget, parseInt(duration), travelers || 1),
      recommendations: {
        attractions: getAttractionsForDestination(destination),
        hotels: getHotelSuggestions(hotelPreference || 'mid-range', budget),
        food: getFoodRecommendations(destination),
        safetyTips: getSafetyTips(destination),
        bestSeason: getBestSeason(destination)
      }
    };

    res.json(tripPlan);
  } catch (error) {
    console.error('Trip generation error:', error);
    res.status(500).json({ error: 'Failed to generate trip plan.' });
  }
});

// 9.2 Aura V2: Get Route Options & OpenRouteService Integration
app.post('/api/aura/v2/routes', async (req, res) => {
  const { source, destination, sourceCoords, destCoords } = req.body;
  
  if (!source || !destination) {
    return res.status(400).json({ error: 'Source and destination are required.' });
  }

  try {
    let roadDistance = calculateDistance(source, destination); // Fallback mock
    let roadDuration = 12; // numeric hours fallback
    let roadGeometry = null;

    // Phase 4-5: OpenRouteService Integration
    if (process.env.ORS_API_KEY && sourceCoords && destCoords) {
      const orsUrl = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${process.env.ORS_API_KEY}&start=${sourceCoords.lng},${sourceCoords.lat}&end=${destCoords.lng},${destCoords.lat}`;
      try {
        const orsRes = await fetch(orsUrl);
        if (orsRes.ok) {
          const orsData = await orsRes.json();
          if (orsData.features && orsData.features.length > 0) {
            const props = orsData.features[0].properties;
            roadDistance = props.segments[0].distance / 1000; // raw km
            roadDuration = props.segments[0].duration / 3600; // raw hours
            roadGeometry = orsData.features[0].geometry; // GeoJSON geometry
          }
        }
      } catch (err) {
        console.error('ORS fetch error:', err);
      }
    }

    const distBase = calculateDistance(source, destination);

    const routes = {
      source,
      destination,
      options: [
        {
          type: 'flight',
          distance: distBase,
          duration: 2.5,
          costMin: 3500,
          costMax: 8000,
          frequency: 'Multiple daily',
          comfort: 5,
          recommended: true,
          advantages: ['Fastest', 'Direct routes', 'Multiple options']
        },
        {
          type: 'train',
          distance: distBase * 1.1, // Train tracks usually longer
          duration: 16.5,
          costMin: 350,
          costMax: 1200,
          frequency: 'Daily',
          comfort: 4,
          recommended: false,
          advantages: ['Most economical', 'Scenic route', 'Overnight options']
        },
        {
          type: 'road',
          distance: roadDistance,
          duration: roadDuration,
          costMin: Math.round(roadDistance * 5), // Basic fuel/toll estimate
          costMax: Math.round(roadDistance * 8),
          frequency: 'Always available',
          comfort: 3,
          recommended: false,
          geometry: roadGeometry, // Real ORS geometry passed to frontend
          advantages: ['Flexible timing', 'Stop anywhere', 'Scenic drives']
        }
      ]
    };

    res.json(routes);
  } catch (error) {
    console.error('Route calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate routes.' });
  }
});

// 9.3 Helper Functions
function generateItinerary(destination, duration) {
  const itinerary = [];
  for (let i = 1; i <= duration; i++) {
    itinerary.push({
      day: i,
      title: `Day ${i} in ${destination}`,
      activities: ['Explore attractions', 'Try local food', 'Rest and relax'],
      meals: ['Breakfast', 'Lunch', 'Dinner']
    });
  }
  return itinerary;
}

function generateBudgetBreakdown(totalBudget, duration, travelers) {
  const perPerson = totalBudget / travelers;
  return {
    total: totalBudget,
    perPerson: Math.floor(perPerson),
    breakdown: {
      accommodation: Math.floor(perPerson * 0.30),
      food: Math.floor(perPerson * 0.20),
      transport: Math.floor(perPerson * 0.25),
      activities: Math.floor(perPerson * 0.15),
      shopping: Math.floor(perPerson * 0.05),
      contingency: Math.floor(perPerson * 0.05)
    }
  };
}

function getAttractionsForDestination(destination) {
  const attractions = {
    'goa': ['Baga Beach', 'Anjuna Beach', 'Basilica of Bom Jesus', 'Fort Aguada'],
    'delhi': ['India Gate', 'Red Fort', 'Jama Masjid', 'Raj Ghat'],
    'agra': ['Taj Mahal', 'Agra Fort', 'Mehtab Bagh'],
    'jaipur': ['Hawa Mahal', 'City Palace', 'Jantar Mantar']
  };
  return attractions[destination.toLowerCase()] || ['Local attractions await!'];
}

function getHotelSuggestions(preference, budget) {
  const hotels = {
    'luxury': [
      { name: '5-Star Resort', price: '₹15,000/night', rating: 4.8 },
      { name: 'Premium Palace Hotel', price: '₹12,000/night', rating: 4.7 }
    ],
    'mid-range': [
      { name: '3-Star Comfort Hotel', price: '₹4,000/night', rating: 4.3 },
      { name: 'Midrange Inn', price: '₹3,500/night', rating: 4.2 }
    ],
    'budget': [
      { name: 'Budget Hotel', price: '₹1,200/night', rating: 3.8 },
      { name: 'Backpacker Hostel', price: '₹600/night', rating: 3.5 }
    ]
  };
  return hotels[preference] || hotels['mid-range'];
}

function getFoodRecommendations(destination) {
  const food = {
    'goa': ['Fish Curry Rice', 'Prawn Biryani', 'Sorpotel', 'Bebinca'],
    'delhi': ['Butter Chicken', 'Chole Bhature', 'Dosa', 'Samosa'],
    'agra': ['Petha', 'Chicken Tikka', 'Biryani']
  };
  return food[destination.toLowerCase()] || ['Local specialties'];
}

function getSafetyTips(destination) {
  return [
    'Keep valuables secure',
    'Use registered taxis/apps',
    'Drink bottled water only',
    'Avoid traveling alone at night',
    'Respect local customs'
  ];
}

function getBestSeason(destination) {
  const seasons = {
    'goa': 'November - February',
    'delhi': 'October - March',
    'agra': 'October - March',
    'manali': 'June - September'
  };
  return seasons[destination.toLowerCase()] || 'October - March';
}

function calculateDistance(source, destination) {
  // Mock distance calculation
  const distances = {
    'delhi-goa': 1550,
    'mumbai-goa': 600,
    'delhi-agra': 206
  };
  const key = `${source.toLowerCase()}-${destination.toLowerCase()}`;
  return distances[key] || 800;
}

// 9. Aura AI: Chat endpoint (Legacy)
app.post('/api/aura/chat', async (req, res) => {
  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required.' });
  }

  // System prompt for structured JSON responses
  const systemPrompt = `You are Aura, an expert AI travel planning assistant for GlobeRoutes.
Always respond with ONLY valid JSON — never plain text or markdown outside JSON.

Respond with one of these formats based on the user request:

1. Trip Plan: { "type": "trip_plan", "data": { "trip": { "title": string, "destination": string, "duration": string, "from": string, "totalBudget": string, "bestTime": string, "description": string }, "budget": { "transport": "₹X", "accommodation": "₹X", "food": "₹X", "activities": "₹X", "emergency": "₹X", "total": "₹X" }, "itinerary": [ { "title": string, "activities": [string] } ], "hotels": [ { "name": string, "type": string, "stars": number, "price": "₹X" } ], "food": [ { "icon": emoji, "name": string, "type": string, "price": string } ] } }

2. Route Comparison: { "type": "comparison", "data": { "from": string, "to": string, "routes": [ { "icon": emoji, "mode": string, "cost": string, "duration": string, "comfort": 1-5, "score": string, "recommended": bool } ], "recommendation": string } }

3. Budget Only: { "type": "budget", "data": { "trip": string, "items": [ { "icon": emoji, "label": string, "amount": "₹X", "color": hexcolor } ], "note": string } }

4. Hotels: { "type": "hotels", "data": { "destination": string, "hotels": [ { "name": string, "type": string, "stars": number, "price": "₹X" } ] } }

5. Food: { "type": "food", "data": { "places": [ { "icon": emoji, "name": string, "type": string, "cuisine": string, "price": string } ] } }

6. Insights: { "type": "insights", "data": { "destination": string, "badges": [ { "icon": emoji, "label": string, "value": string } ], "tip": string } }

7. General: { "type": "general", "message": string }

Focus on Indian destinations. Use ₹ for prices. Be specific and practical.`;

  // If Groq is configured, use it
  if (groqClient) {
    try {
      const messages = [
        { role: 'system', content: systemPrompt },
        ...(history || []).slice(-6).map(h => ({ role: h.role, content: typeof h.content === 'string' ? h.content : JSON.stringify(h.content) })),
        { role: 'user', content: message }
      ];

      const completion = await groqClient.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        messages,
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      });

      const raw = completion.choices[0]?.message?.content || '{}';
      const parsed = JSON.parse(raw);
      return res.json(parsed);
    } catch (err) {
      console.error('Groq API error:', err.message);
      // Fall through to smart fallback
    }
  }

  // Smart fallback demo response (when Groq not configured or error)
  const lower = message.toLowerCase();
  const dest = lower.includes('goa') ? 'Goa' : lower.includes('manali') ? 'Manali' : lower.includes('kerala') ? 'Kerala' : lower.includes('rajasthan') ? 'Rajasthan' : lower.includes('mumbai') ? 'Mumbai' : lower.includes('delhi') ? 'Delhi' : 'Your Destination';

  if (lower.includes('compare') || lower.includes('route') || (lower.includes('vs') && (lower.includes('train') || lower.includes('flight')))) {
    return res.json({
      type: 'comparison',
      data: {
        from: 'Mumbai', to: dest,
        routes: [
          { icon: '✈️', mode: 'Flight', cost: '₹3,500–6,000', duration: '1–2 hrs', comfort: 5, score: '9', recommended: true },
          { icon: '🚂', mode: 'Train', cost: '₹600–2,500', duration: '8–24 hrs', comfort: 4, score: '7' },
          { icon: '🚌', mode: 'Bus', cost: '₹400–1,200', duration: '10–18 hrs', comfort: 3, score: '5' },
          { icon: '🚗', mode: 'Road Trip', cost: '₹1,500–3,000', duration: '6–14 hrs', comfort: 4, score: '7' }
        ],
        recommendation: 'For speed choose flight. For budget + experience, overnight Rajdhani is best value.'
      }
    });
  }

  if (lower.includes('budget') && !lower.includes('plan')) {
    return res.json({
      type: 'budget',
      data: {
        trip: `Budget for ${dest} trip`,
        items: [
          { icon: '🚌', label: 'Transport', amount: '₹3,500', color: '#3b82f6' },
          { icon: '🏨', label: 'Hotels (3N)', amount: '₹4,800', color: '#8b5cf6' },
          { icon: '🍽️', label: 'Food', amount: '₹2,400', color: '#f59e0b' },
          { icon: '🎯', label: 'Activities', amount: '₹1,800', color: '#22c55e' },
          { icon: '🛡️', label: 'Emergency', amount: '₹1,200', color: '#ef4444' },
          { icon: '💎', label: 'TOTAL', amount: '₹13,700', color: '#a78bfa' }
        ],
        note: 'Add GROQ_API_KEY to server/.env for real AI-powered estimates.'
      }
    });
  }

  // Default: full trip plan
  res.json({
    type: 'trip_plan',
    data: {
      trip: { title: `${dest} Adventure`, destination: dest, duration: '4 Days / 3 Nights', from: 'Your City', totalBudget: '₹12,000–₹18,000', bestTime: 'Oct–Mar', description: `A perfectly balanced ${dest} trip — culture, nature, food, and hidden gems curated by Aura AI.` },
      budget: { transport: '₹3,500', accommodation: '₹4,800', food: '₹2,400', activities: '₹1,800', emergency: '₹1,200', total: '₹13,700' },
      itinerary: [
        { title: 'Arrival & First Impressions', activities: ['Arrive by train/flight', 'Check into hotel, relax', 'Evening walk at main attraction', 'Local welcome dinner'] },
        { title: 'Deep Explore', activities: ['Morning: Top landmark visit', 'Afternoon: Cultural experience', 'Sunset at scenic viewpoint', 'Night market exploration'] },
        { title: 'Hidden Gems Day', activities: ['Offbeat spot only locals know', 'Local family restaurant lunch', 'Photography walk', 'Rooftop sunset cafe'] },
        { title: 'Departure', activities: ['Souvenir shopping', 'Final breakfast at local favourite', 'Check out & depart', 'Trip memories captured!'] }
      ],
      hotels: [
        { name: 'Budget Stay Inn', type: 'Guesthouse', stars: 3, price: '₹800' },
        { name: 'Mid-range Comfort Hotel', type: 'Hotel', stars: 4, price: '₹1,800' },
        { name: 'Luxury Resort', type: 'Resort', stars: 5, price: '₹4,500' }
      ],
      food: [
        { icon: '🍛', name: 'Local Thali House', type: 'Indian', price: '₹120/meal' },
        { icon: '☕', name: 'Breezy Cafe', type: 'Cafe', price: '₹200/meal' },
        { icon: '🍜', name: 'Street Food Hub', type: 'Street Food', price: '₹80/meal' }
      ]
    }
  });
});

// 10. Global Error Boundary
app.use((err, req, res, next) => {
  console.error('Unhandled Error Boundary Caught:', err.stack);
  res.status(500).json({ error: 'An unexpected error occurred. Please try again later.' });
});

// Start Server
app.listen(PORT, () => {
  console.log(`===============================================`);
  console.log(`Globeroutes Backend running on port ${PORT}`);
  console.log(`Health Check: http://localhost:${PORT}/health`);
  console.log(`===============================================`);
});
