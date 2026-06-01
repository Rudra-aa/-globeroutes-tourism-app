/**
 * Aura V2 Natural Language Parser
 * Extracts travel information from free-form user input
 */

class AuraParser {
  constructor() {
    this.patterns = {
      // City/Location patterns
      cityPattern: /from\s+([a-zA-Z\s]+?)(?:\s+to\s+|$)|from\s+([a-zA-Z\s]+?)(?:\s|,)/i,
      destinationPattern: /to\s+([a-zA-Z\s]+?)(?:\s+for\s+|$)|destination\s+([a-zA-Z\s]+?)(?:\s|,|$)/i,
      
      // Budget patterns
      budgetPattern: /(?:₹|rupees?|budget|under|cost|price)\s*[\s:]*(\d+[,\d]*)\s*(cr|lakh|thousand|k)?/i,
      
      // Duration patterns
      durationPattern: /(\d+)[-\s]*(?:day|night|week|month)s?/i,
      
      // Transport patterns
      transportPattern: /(?:by\s+)?(?:train|flight|air|road|bus|car|taxi|bike|cycle)/i,
      
      // Hotel preference
      hotelPattern: /(?:hotel|accommodation|stay|lodge)\s+(\w+)/i,
      
      // Travel style
      stylePattern: /(?:luxury|budget|adventure|cultural|beach|mountain|offbeat|backpacking|luxury|family)/i,
      
      // Number of travelers
      travelersPattern: /(?:for\s+)?(\d+)\s+(?:person|people|traveler|tourist|me\s+and)/i,
      
      // Route request
      routePattern: /(?:show|display|find|get)\s+(?:route|path|way|direction|map)(?:\s+from\s+(.+?)\s+to\s+(.+))?/i
    };

    this.cities = ['delhi', 'mumbai', 'bangalore', 'hyderabad', 'goa', 'gwalior', 'manali', 'shimla', 'leh', 'agra', 'dubai', 'jaipur', 'udaipur', 'rajasthan', 'kerala', 'darjeeling', 'ooty'];
    this.transportModes = ['train', 'flight', 'road', 'bus', 'car'];
    this.hotelTypes = ['luxury', 'budget', 'midrange', 'resort', 'hostel', 'heritage'];
    this.travelStyles = ['luxury', 'budget', 'adventure', 'cultural', 'beach', 'mountain', 'offbeat', 'backpacking', 'family'];
  }

  /**
   * Parse user message and extract travel information
   */
  parse(userMessage) {
    const text = userMessage.toLowerCase().trim();
    const result = {
      sourceCity: this.extractCity(text, 'from'),
      destination: this.extractCity(text, 'to'),
      budget: this.extractBudget(text),
      duration: this.extractDuration(text),
      transportPreference: this.extractTransport(text),
      hotelPreference: this.extractHotel(text),
      travelStyle: this.extractStyle(text),
      travelers: this.extractTravelers(text),
      isRouteRequest: this.isRouteRequest(text),
      intent: this.detectIntent(text),
      hasCompleteInfo: false
    };

    // Fix the fallback bug: we shouldn't assume it's the destination unless there's only one
    // Remove the bad parse block we just added
    // Let's modify extractCity instead

    result.hasCompleteInfo = result.sourceCity && result.destination && result.budget && result.duration;
    return result;
  }

  /**
   * Extract city name from text
   */
  extractCity(text, position) {
    const pattern = position === 'from' 
      ? /from\s+([a-zA-Z\s]+?)(?:\s+to\s+|,|\s+for\s+|$)/i
      : /to\s+([a-zA-Z\s]+?)(?:\s+for\s+|,|$|\s+under\s+|\s+in\s+)/i;

    const match = text.match(pattern);
    if (match && match[1]) {
      const city = match[1].trim();
      const forbiddenWords = ['compare', 'route', 'plan', 'trip', 'budget', 'hotel', 'show', 'find', 'get', 'want'];
      const hasForbidden = forbiddenWords.some(w => city.toLowerCase().includes(w));
      
      if (!hasForbidden) {
        const normalized = this.normalizeCity(city);
        if (normalized) return normalized;
        return city;
      }
    }

    // Fallback: search for known cities
    for (const city of this.cities) {
      if (text.includes(city)) {
        // Prevent grabbing the destination city when looking for the source city
        if (position === 'from' && new RegExp(`to\\s+${city}`, 'i').test(text)) continue;
        // Prevent grabbing the source city when looking for the destination city
        if (position === 'to' && new RegExp(`from\\s+${city}`, 'i').test(text)) continue;
        
        return city;
      }
    }

    return null;
  }

  /**
   * Normalize city names
   */
  normalizeCity(city) {
    const cityMap = {
      'gwl': 'gwalior',
      'gwr': 'gwalior',
      'mumbai': 'mumbai',
      'bombay': 'mumbai',
      'ncr': 'delhi',
      'raj': 'rajasthan',
      'maharashtra': 'maharashtra'
    };

    const lower = city.toLowerCase().trim();
    return cityMap[lower] || lower;
  }

  /**
   * Extract budget from text
   */
  extractBudget(text) {
    let match = text.match(this.patterns.budgetPattern);
    
    // Fallback: If it's a short answer answering a budget prompt (e.g. "5000", "5k")
    if (!match && text.split(/\s+/).length <= 3 && !text.match(/day|night|week|month/i)) {
      match = text.match(/^(\d+[,\d]*)\s*(cr|lakh|thousand|k)?$/i);
    }

    if (match && match[1]) {
      let amount = parseInt(match[1].replace(/,/g, ''));
      const multiplier = match[2];

      if (multiplier) {
        const multipliers = {
          'cr': 10000000,
          'crore': 10000000,
          'lakh': 100000,
          'l': 100000,
          'thousand': 1000,
          'k': 1000
        };
        amount *= multipliers[multiplier.toLowerCase()] || 1;
      }

      return {
        amount,
        currency: '₹',
        range: this.budgetRange(amount)
      };
    }
    return null;
  }

  /**
   * Categorize budget into ranges
   */
  budgetRange(amount) {
    if (amount < 10000) return 'ultra-budget';
    if (amount < 50000) return 'budget';
    if (amount < 100000) return 'mid-range';
    if (amount < 200000) return 'premium';
    return 'luxury';
  }

  /**
   * Extract trip duration
   */
  extractDuration(text) {
    const match = text.match(this.patterns.durationPattern);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    // If it's a raw number and likely an answer to "how many days"
    const rawNumMatch = text.match(/^(\d+)$/);
    if (rawNumMatch) {
      return parseInt(rawNumMatch[1]);
    }
    return null;
  }

  /**
   * Extract transport preference
   */
  extractTransport(text) {
    for (const mode of this.transportModes) {
      if (text.includes(mode)) return mode;
    }
    return null;
  }

  /**
   * Extract hotel preference
   */
  extractHotel(text) {
    for (const type of this.hotelTypes) {
      if (text.includes(type)) return type;
    }
    return null;
  }

  /**
   * Extract travel style
   */
  extractStyle(text) {
    for (const style of this.travelStyles) {
      if (text.includes(style)) return style;
    }
    return null;
  }

  /**
   * Extract number of travelers
   */
  extractTravelers(text) {
    const match = text.match(this.patterns.travelersPattern);
    if (match && match[1]) {
      return parseInt(match[1]);
    }
    return 1;
  }

  /**
   * Check if user is asking for route
   */
  isRouteRequest(text) {
    return /(?:show|display|find|get|draw|plot|route|path|way|direction|map|compare|vs|train vs flight)/i.test(text);
  }

  /**
   * Detect user's intent
   */
  detectIntent(text) {
    if (/(?:compare|vs|cheapest|fastest|option|better|train vs flight|flight vs train)/i.test(text)) return 'compare-routes';
    if (/(?:road trip|drive to|driving|car to)/i.test(text)) return 'road-trip';
    if (/(?:budget|cost|expense|price|under ₹|under r|cheap)/i.test(text)) return 'budget-plan';
    if (/(?:hidden gem|secret|unexplored|offbeat)/i.test(text)) return 'hidden-gems';
    if (/(?:hotel|stay|accommodation|lodge|resort|hostel)/i.test(text)) return 'hotel-search';
    if (/(?:food|eat|restaurant|cuisine|cafe|dish)/i.test(text)) return 'food-discovery';
    if (/(?:attraction|place|thing|see|visit|destination)/i.test(text)) return 'attractions';
    if (/(?:route|direction|path|map|show me how)/i.test(text)) return 'show-route';
    if (/(?:plan|itinerary|trip|tour)/i.test(text)) return 'plan-trip';
    return 'general-travel-query';
  }

  /**
   * Generate follow-up question based on missing info
   */
  generateQuestion(missing, context) {
    const questions = {
      sourceCity: "Where are you traveling from?",
      destination: "Which city or destination would you like to visit?",
      budget: "What's your total budget for this trip?",
      duration: "How many days are you planning to stay?",
      transportPreference: "Do you prefer train, flight, or road travel?",
      travelers: "How many people are traveling?"
    };

    if (missing.length > 0) {
      return questions[missing[0]] || "Tell me more about your trip.";
    }

    return null;
  }
}

// Export for use in other modules
window.AuraParser = AuraParser;
