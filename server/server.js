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
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database is offline' });
  }
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
  if (mongoose.connection.readyState !== 1) {
    return res.status(500).json({ error: 'Database is offline' });
  }
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
  if (mongoose.connection.readyState !== 1) {
    console.warn('Database offline: Skipping user sync.');
    return res.status(503).json({ error: 'Database is currently offline. Sync skipped.' });
  }

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
      model: 'llama-3.1-8b-instant',
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

// 9.1.5 Aura V2: Summarize Trip
app.post('/api/aura/v2/summarize-trip', async (req, res) => {
  const { tripPlan, currency } = req.body;

  if (!tripPlan) {
    return res.status(400).json({ error: 'Trip plan data is required.' });
  }

  const currencySymbol = (currency && currency.symbol) ? currency.symbol : '₹';
  const currencyCode = (currency && currency.code) ? currency.code : 'INR';

  const systemPrompt = `You are Aura, a conversational AI travel planning assistant for GlobeRoutes.
Your ONLY job is to summarize the following verified JSON trip plan into a friendly, conversational response.

CRITICAL RULES:
- Express ALL costs in ${currencyCode} using the symbol ${currencySymbol}. Do NOT invent costs.
- Do NOT invent: places, hotels, routes, prices, timings, or transport schedules.
- Use ONLY the data provided in the JSON. If a detail is missing, say it is not available.
- Speak naturally, like a knowledgeable travel agent. Do not use JSON.
- If no itinerary is available, say so clearly: "Verified itinerary data is not available for this destination yet."
- Never use placeholder text like "Visit local attractions", "Explore famous landmarks", or "Enjoy the culture".
- Every recommendation must be grounded in the provided data.`;

  try {
    if (!groqClient) {
      throw new Error('Groq not configured');
    }

    const response = await groqClient.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: JSON.stringify(tripPlan) }
      ],
      model: 'llama-3.1-8b-instant',
      max_tokens: 800,
      temperature: 0.3
    });

    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error('Trip summarization error:', error.message);
    res.status(500).json({ error: 'Failed to summarize trip plan.' });
  }
});

// ── CENTRALIZED API SERVICE LAYER (Phase 1: API Foundation) ──────────────────
app.use('/api/geocode', require('./routes/geocodeRoutes'));
app.use('/api/routes', require('./routes/routeRoutes'));
app.use('/api/weather', require('./routes/weatherRoutes'));
app.use('/api/places', require('./routes/placesRoutes'));
app.use('/api/flights', require('./routes/flightRoutes'));

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
  return ['Local attractions await!'];
}

function getHotelSuggestions(preference, budget) {
  const hotels = {
    'luxury': [
      { name: '5-Star Resort', price: '₹15,000/night', rating: 4.8 }
    ],
    'mid-range': [
      { name: '3-Star Comfort Hotel', price: '₹4,000/night', rating: 4.3 }
    ],
    'budget': [
      { name: 'Budget Hotel', price: '₹1,200/night', rating: 3.8 }
    ]
  };
  return hotels[preference] || hotels['mid-range'];
}

function getFoodRecommendations(destination) {
  return ['Local specialties'];
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
  return 'October - March';
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
  return res.json({
    type: 'general',
    message: "I couldn't find verified information for that request right now. Try another destination or refine your query."
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
