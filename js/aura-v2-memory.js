/**
 * Aura V2 Conversation Memory System
 * Maintains user context across the conversation session
 * Stores: source city, destination, budget, duration, transport, hotels, travel style
 */

class AuraMemory {
  constructor() {
    this.conversationHistory = [];
    this.context = {
      sourceCity: null,
      destination: null,
      budget: null,
      currency: '₹',
      duration: null,
      startDate: null,
      endDate: null,
      travelers: 1,
      transportPreference: null,
      hotelPreference: null,
      travelStyle: null,
      requiredInformation: [],
      clarificationQuestions: []
    };
    this.routeData = null;
    this.lastUserMessage = null;
    this.lastAuraResponse = null;
  }

  /**
   * Add message to conversation history
   */
  addMessage(role, content, metadata = {}) {
    const message = {
      role, // 'user' or 'aura'
      content,
      timestamp: new Date(),
      metadata
    };
    this.conversationHistory.push(message);
    
    if (role === 'user') {
      this.lastUserMessage = content;
    } else if (role === 'aura') {
      this.lastAuraResponse = content;
    }
    
    return message;
  }

  /**
   * Update context from parsed user input
   */
  updateContext(parsed) {
    if (parsed.sourceCity) this.context.sourceCity = parsed.sourceCity;
    if (parsed.destination) this.context.destination = parsed.destination;
    if (parsed.budget) this.context.budget = parsed.budget;
    if (parsed.duration) this.context.duration = parsed.duration;
    if (parsed.travelers) this.context.travelers = parsed.travelers;
    if (parsed.transportPreference) this.context.transportPreference = parsed.transportPreference;
    if (parsed.hotelPreference) this.context.hotelPreference = parsed.hotelPreference;
    if (parsed.travelStyle) this.context.travelStyle = parsed.travelStyle;
    if (parsed.startDate) this.context.startDate = parsed.startDate;
    if (parsed.intent) this.context.intent = parsed.intent;
  }

  /**
   * Get missing required information based on intent
   */
  getMissingInformation(intent) {
    const missing = [];
    const activeIntent = intent || this.context.intent;
    
    // Route & Compare requests only need cities
    if (activeIntent === 'compare-routes' || activeIntent === 'show-route' || activeIntent === 'road-trip') {
      if (!this.context.sourceCity) missing.push('sourceCity');
      if (!this.context.destination) missing.push('destination');
      return missing;
    }
    
    // Hotel search needs destination and hotel preference
    if (activeIntent === 'hotel-search') {
      if (!this.context.destination) missing.push('destination');
      if (!this.context.hotelPreference) missing.push('hotelPreference');
      return missing;
    }

    // Budget plan needs destination and budget
    if (activeIntent === 'budget-plan') {
      if (!this.context.destination) missing.push('destination');
      if (!this.context.budget) missing.push('budget');
      return missing;
    }
    
    // General Trip Planning
    if (activeIntent === 'plan-trip') {
      if (!this.context.sourceCity) missing.push('sourceCity');
      if (!this.context.destination) missing.push('destination');
      if (!this.context.budget) missing.push('budget');
      if (!this.context.duration) missing.push('duration');
      return missing;
    }
    
    // If it's general or attractions, maybe we just need destination
    if (activeIntent === 'attractions' || activeIntent === 'food-discovery' || activeIntent === 'hidden-gems') {
      if (!this.context.destination) missing.push('destination');
      return missing;
    }

    // General travel query needs nothing to be answered directly
    if (activeIntent === 'general-travel-query') {
      return missing;
    }

    // Default missing logic (fallback)
    if (!this.context.destination) missing.push('destination');
    
    return missing;
  }

  /**
   * Check if we have enough information to plan a trip
   */
  isReadyForPlanning() {
    if (!this.context.intent || this.context.intent === 'general-travel-query' || this.context.intent === 'compare-routes') {
      return false; // These intents don't generate a full trip plan
    }
    return this.getMissingInformation().length === 0;
  }

  /**
   * Get conversation summary for AI context
   */
  getSummary() {
    return {
      messagesCount: this.conversationHistory.length,
      context: this.context,
      lastMessage: this.lastUserMessage,
      isReadyForPlanning: this.isReadyForPlanning(),
      missing: this.getMissingInformation()
    };
  }

  /**
   * Clear conversation but keep context
   */
  clearHistory() {
    this.conversationHistory = [];
    this.lastUserMessage = null;
    this.lastAuraResponse = null;
  }

  /**
   * Reset everything
   */
  reset() {
    this.clearHistory();
    this.context = {
      sourceCity: null,
      destination: null,
      budget: null,
      currency: '₹',
      duration: null,
      startDate: null,
      endDate: null,
      travelers: 1,
      transportPreference: null,
      hotelPreference: null,
      travelStyle: null,
      requiredInformation: [],
      clarificationQuestions: []
    };
    this.routeData = null;
  }

  /**
   * Export memory for persistence
   */
  export() {
    return JSON.stringify({
      history: this.conversationHistory,
      context: this.context,
      routeData: this.routeData
    });
  }

  /**
   * Import memory from storage
   */
  import(data) {
    const parsed = JSON.parse(data);
    this.conversationHistory = parsed.history || [];
    this.context = { ...this.context, ...parsed.context };
    this.routeData = parsed.routeData;
  }
}

// Export for use in other modules
window.AuraMemory = AuraMemory;
