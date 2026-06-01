/**
 * Aura V2 Conversational AI Engine
 * Main orchestrator for conversation flow, AI responses, and map integration
 */

class AuraConversationalAI {
  constructor() {
    this.memory = new AuraMemory();
    this.parser = new AuraParser();
    this.router = new AuraRouter();
    this.planner = new AuraTravelPlanner();
    this.backendUrl = 'http://localhost:5001';
    this.groqClient = null;
    this.voiceRecognition = null;
    this.voiceSynthesis = null;
    this.initVoiceSupport();
  }

  /**
   * Initialize voice support
   */
  initVoiceSupport() {
    // Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.voiceRecognition = new SpeechRecognition();
      this.voiceRecognition.continuous = false;
      this.voiceRecognition.interimResults = false;
      this.voiceRecognition.language = 'en-IN';
    }

    // Speech Synthesis (Text-to-Speech)
    if ('speechSynthesis' in window) {
      this.voiceSynthesis = window.speechSynthesis;
    }
  }

  /**
   * Main conversation handler
   */
  async handleUserMessage(message) {
    const userInput = message.trim();
    if (!userInput) return;

    this.memory.lastUserMessage = userInput;
    this.memory.addMessage('user', userInput);

    // Parse user input
    const parsed = this.parser.parse(userInput);
    
    // Check what the engine was explicitly expecting before applying this new message
    const expectedMissing = this.memory.getMissingInformation(this.memory.context.intent || parsed.intent);

    // Phase F: Debug Logging
    console.log('--- AURA DEBUG LOG ---');
    console.log('Message:', userInput);
    console.log('Detected Intent:', parsed.intent || this.memory.context.intent);
    console.log('Expected Missing (Before):', expectedMissing);
    console.log('Raw Extracted Entities:', parsed);

    // Phase A & B: Smart Entity Extraction & Context Matching
    // If the message is short and we are expecting a specific field, force map it
    const isShortResponse = userInput.split(/\s+/).length <= 4 && !/(to|from|for|under)/i.test(userInput);
    
    if (isShortResponse && expectedMissing.length > 0) {
      const field = expectedMissing[0]; // The specific field we just asked the user for
      
      if ((field === 'sourceCity' || field === 'destination') && (!parsed.sourceCity && !parsed.destination)) {
         parsed[field] = this.parser.normalizeCity(userInput);
      }
      if (field === 'budget' && !parsed.budget) {
         parsed.budget = this.parser.extractBudget(userInput);
      }
    }

    // Fix the misattribution bug where sourceCity was captured instead of destination
    if (parsed.sourceCity && !parsed.destination && expectedMissing.includes('destination') && !expectedMissing.includes('sourceCity')) {
       parsed.destination = parsed.sourceCity;
       parsed.sourceCity = null;
    } else if (parsed.destination && !parsed.sourceCity && expectedMissing.includes('sourceCity') && !expectedMissing.includes('destination')) {
       parsed.sourceCity = parsed.destination;
       parsed.destination = null;
    }

    // Update context with extracted information
    this.memory.updateContext(parsed);
    
    console.log('Updated Session State:', this.memory.context);
    console.log('Missing Info (After):', this.memory.getMissingInformation());
    console.log('----------------------');

    // Generate response
    let response = '';
    let cards = [];
    let action = null;

    try {
      // Check for route request
      if (parsed.isRouteRequest && parsed.sourceCity && parsed.destination) {
        return await this.handleRouteRequest(parsed.sourceCity, parsed.destination);
      }

      // Get missing information based on current intent
      const missing = this.memory.getMissingInformation(parsed.intent || this.memory.context.intent);

      // If intent is route request but we are missing source/dest, prompt for them
      if ((parsed.intent === 'compare-routes' || parsed.intent === 'show-route' || this.memory.context.intent === 'compare-routes') && missing.length === 0) {
        return await this.handleRouteRequest(this.memory.context.sourceCity, this.memory.context.destination);
      }

      if (missing.length > 0) {
        // Ask follow-up question
        response = this.parser.generateQuestion(missing, this.memory.context);
        action = 'ask-for-info';
      } else if (this.memory.isReadyForPlanning()) {
        // Generate travel plan
        const tripPlan = await this.planner.generateTripPlan(this.memory.context);
        response = this.generateTripResponse(tripPlan);
        cards = this.formatTripPlanCards(tripPlan);
        action = 'generate-plan';
      } else {
        // Generic response using Groq AI
        response = await this.getAIResponse(userInput);
        action = 'general-response';
      }
    } catch (error) {
      console.error('Error in conversation handler:', error);
      response = "I encountered an issue processing your request. Please try again.";
      action = 'error';
    }

    // Add Aura response to memory
    this.memory.addMessage('aura', response, {
      action,
      parsed,
      cardsCount: cards.length
    });

    return {
      response,
      cards,
      action,
      context: this.memory.context,
      suggestedActions: this.generateSuggestedActions(parsed)
    };
  }

  /**
   * Formatters for Response Intelligence
   */
  formatDistance(km) {
    if (!km || isNaN(km)) return 'Distance N/A';
    return `≈ ${Math.round(km).toLocaleString()} km`;
  }

  formatDuration(hours) {
    if (!hours || isNaN(hours)) return 'Time N/A';
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    if (h === 0) return `≈ ${m}m`;
    if (m === 0) return `≈ ${h}h`;
    return `≈ ${h}h ${m}m`;
  }

  formatCost(min, max) {
    if (!min || isNaN(min)) return 'Cost N/A';
    if (!max || isNaN(max) || min === max) return `₹${Math.round(min).toLocaleString()} estimated`;
    return `₹${Math.round(min).toLocaleString()}–₹${Math.round(max).toLocaleString()} estimated`;
  }

  /**
   * Handle route request
   */
  async handleRouteRequest(sourceCity, destinationCity) {
    try {
      const comparison = await this.router.compareRoutes(sourceCity, destinationCity);

      if (!comparison || !comparison.routes || comparison.routes.length === 0) {
         throw new Error("No routes found");
      }

      let response = `Here are the best routes from **${comparison.source}** to **${comparison.destination}**:\n\n`;

      const routeIcons = { road: '🚗', train: '🚆', flight: '✈️' };
      const routeLabels = { road: 'Road', train: 'Train', flight: 'Flight' };
      const bestFor = { 
        road: 'Flexible timing & scenic drives', 
        train: 'Budget travellers & overnight journeys', 
        flight: 'Fast travel & business trips' 
      };

      comparison.routes.forEach(route => {
        response += `### ${routeIcons[route.type] || '🧭'} ${routeLabels[route.type] || route.type}\n\n`;
        if (route.type === 'road') {
           response += `**Driving Distance:**\n${this.formatDistance(route.distance)}\n\n`;
           response += `**Driving Time:**\n${this.formatDuration(route.duration)}\n\n`;
           response += `**Fuel & Toll Estimate:**\n${this.formatCost(route.costMin, route.costMax)}\n\n`;
        } else {
           response += `**Estimated Cost:**\n${this.formatCost(route.costMin, route.costMax)}\n\n`;
           response += `**Travel Time:**\n${this.formatDuration(route.duration)}\n\n`;
        }
        response += `**Best For:**\n${bestFor[route.type] || 'General travel'}\n\n`;
      });

      response += `---\n### 💡 Recommendation\n\n`;
      
      let bestMode = 'Flight';
      let reasons = [];
      
      if (this.memory.context.transportPreference) {
          bestMode = this.memory.context.transportPreference;
          reasons.push(`Matches your preference for ${bestMode}`);
      } else if (this.memory.context.budget && comparison.cheapest) {
          bestMode = comparison.cheapest.type;
          reasons.push(`Lowest cost`);
          reasons.push(`Suitable for your budget`);
      } else if (comparison.fastest) {
          bestMode = comparison.fastest.type;
          reasons.push(`Fastest travel time`);
      }
      
      const bestModeCap = bestMode.charAt(0).toUpperCase() + bestMode.slice(1);
      
      response += `**Recommended: ${bestModeCap}**\n\n**Reason:**\n`;
      if (reasons.length === 0) reasons.push(`Most balanced option between speed and cost`);
      reasons.forEach(r => { response += `- ${r}\n`; });
      response += `\n`;

      response += `*I've mapped these routes for you on the Explorer!*`;

      return {
        response,
        cards: this.formatRouteComparisonCards(comparison),
        action: 'show-routes',
        routeData: comparison,
        mapAction: {
          type: 'draw-routes',
          source: sourceCity,
          destination: destinationCity,
          routes: comparison.routes
        }
      };
    } catch (error) {
      console.error('Error in route request:', error);
      return {
        response: "I couldn't retrieve live route information right now, but I can provide an estimated comparison.",
        cards: [],
        action: 'error'
      };
    }
  }

  /**
   * Get AI response using Groq
   */
  async getAIResponse(userInput) {
    try {
      // Call backend for Groq response
      const response = await fetch(`${this.backendUrl}/api/aura/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userInput,
          context: this.memory.context,
          conversationHistory: this.memory.conversationHistory.slice(-5) // Last 5 messages
        })
      });

      const data = await response.json();
      return data.response || "I'm here to help with your travel plans!";
    } catch (error) {
      console.error('Error calling Groq API:', error);
      // Fallback response
      return this.generateFallbackResponse(userInput);
    }
  }

  /**
   * Generate fallback response
   */
  generateFallbackResponse(userInput) {
    const responses = [
      "That's interesting! Tell me more about your travel plans.",
      "I can help you plan this trip! Where are you traveling from?",
      "Great destination! What's your budget and duration?",
      "I'd love to help! Which city are you starting from?",
      "Let me help you plan an amazing trip!"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  /**
   * Generate trip response
   */
  generateTripResponse(tripPlan) {
    const budget = tripPlan.budget ? `₹${tripPlan.budget.amount}` : 'your budget';
    return `I've created an amazing ${tripPlan.duration}-day itinerary to ${tripPlan.destination} for ${tripPlan.travelers} ${tripPlan.travelers > 1 ? 'travelers' : 'traveler'} within ${budget}!\n\n` +
      `Below you'll find:\n` +
      `• Day-by-day activities\n` +
      `• Budget breakdown\n` +
      `• Hotel suggestions\n` +
      `• Local food recommendations\n` +
      `• Safety tips & best season to visit`;
  }

  /**
   * Format trip plan cards
   */
  formatTripPlanCards(tripPlan) {
    const cards = [];

    // Phase D: Conditional UI Rendering
    // Never display empty cards or ₹0 values

    // Itinerary card
    if (tripPlan.itinerary && Array.isArray(tripPlan.itinerary) && tripPlan.itinerary.length > 0) {
      cards.push({
        type: 'itinerary',
        title: 'Day-wise Itinerary',
        data: tripPlan.itinerary
      });
    }

    // Budget card
    if (tripPlan.budget_breakdown && tripPlan.budget_breakdown.total > 0) {
      cards.push({
        type: 'budget',
        title: 'Budget Breakdown',
        data: tripPlan.budget_breakdown
      });
    }

    // Attractions card
    if (tripPlan.attractions && Array.isArray(tripPlan.attractions) && tripPlan.attractions.length > 0) {
      cards.push({
        type: 'attractions',
        title: 'Top Attractions',
        data: tripPlan.attractions
      });
    }

    // Hotels card
    if (tripPlan.hotels && Array.isArray(tripPlan.hotels) && tripPlan.hotels.length > 0) {
      cards.push({
        type: 'hotels',
        title: 'Hotel Suggestions',
        data: tripPlan.hotels
      });
    }

    // Food card
    if (tripPlan.food && Array.isArray(tripPlan.food) && tripPlan.food.length > 0) {
      cards.push({
        type: 'food',
        title: 'Local Delicacies',
        data: tripPlan.food
      });
    }

    return cards;
  }

  /**
   * Format route comparison cards
   */
  formatRouteComparisonCards(comparison) {
    const formattedRoutes = comparison.routes.map(r => ({
      ...r,
      duration: this.formatDuration(r.duration),
      cost: this.formatCost(r.costMin, r.costMax)
    }));

    return [{
      type: 'route-comparison',
      title: 'Route Options',
      data: {
        from: comparison.source,
        to: comparison.destination,
        routes: formattedRoutes
      }
    }];
  }

  /**
   * Generate suggested actions
   */
  generateSuggestedActions(parsed) {
    const actions = [];

    if (parsed.intent === 'show-route') {
      actions.push({ label: 'Show on Map', action: 'draw-route' });
      actions.push({ label: 'Get Directions', action: 'directions' });
    }

    if (this.memory.isReadyForPlanning()) {
      actions.push({ label: 'Download Itinerary', action: 'export-plan' });
      actions.push({ label: 'Book Hotels', action: 'book-hotels' });
    }

    if (parsed.intent === 'budget-plan') {
      actions.push({ label: 'Save Budget', action: 'save-budget' });
    }

    return actions;
  }

  /**
   * Start voice input
   */
  startVoiceInput(callback) {
    if (!this.voiceRecognition) {
      console.error('Speech Recognition not supported');
      return;
    }

    this.voiceRecognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      callback(transcript);
    };

    this.voiceRecognition.start();
  }

  /**
   * Speak response using text-to-speech
   */
  speakResponse(text) {
    if (!this.voiceSynthesis) {
      console.error('Text-to-Speech not supported');
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.language = 'en-IN';
    utterance.rate = 1.0;
    this.voiceSynthesis.speak(utterance);
  }

  /**
   * Get conversation memory export
   */
  exportConversation() {
    return this.memory.export();
  }

  /**
   * Clear conversation
   */
  clearConversation() {
    this.memory.reset();
  }
}

// Initialize globally
window.AuraV2 = new AuraConversationalAI();

// Export for use
window.AuraConversationalAI = AuraConversationalAI;
