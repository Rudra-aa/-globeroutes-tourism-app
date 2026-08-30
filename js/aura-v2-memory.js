/**
 * Aura V2 Conversation Memory System
 * Maintains persistent user context across the conversation session.
 * Required fields: destination, sourceCity, currency, budget, duration
 * Optional fields: transportPreference, travelers (asked only when they improve planning quality)
 */

class AuraMemory {
  constructor() {
    this.storageKey = 'globeroutes_aura_session';

    // Default empty state — currency is null until user provides it
    this.defaultState = {
      conversationHistory: [],
      askedQuestions: [],
      context: {
        sourceCity: null,
        destination: null,
        country: null,
        budget: null,
        currency: null,       // null = not yet collected
        duration: null,
        dates: null,
        travelers: null,      // optional
        transportPreference: null,  // optional
        hotelPreference: null,
        travelStyle: null,
        intent: null
      },
      routeData: null,
      lastUserMessage: null,
      lastAuraResponse: null
    };

    this.loadSession();
  }

  loadSession() {
    try {
      const saved = sessionStorage.getItem(this.storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        this.conversationHistory = parsed.conversationHistory || [];
        this.context = { ...this.defaultState.context, ...parsed.context };
        this.askedQuestions = parsed.askedQuestions || [];
        this.routeData = parsed.routeData || null;
        this.lastUserMessage = parsed.lastUserMessage || null;
        this.lastAuraResponse = parsed.lastAuraResponse || null;
      } else {
        this.reset(false);
      }
    } catch (e) {
      console.warn('Could not load Aura session state from sessionStorage.');
      this.reset(false);
    }
  }

  getState() {
    return this.context;
  }

  reset(save = true) {
    this.conversationHistory = [];
    this.context = JSON.parse(JSON.stringify(this.defaultState.context));
    this.askedQuestions = [];
    this.routeData = null;
    this.lastUserMessage = null;
    this.lastAuraResponse = null;
    if (save) this.saveSession();
  }

  saveSession() {
    try {
      const state = {
        conversationHistory: this.conversationHistory,
        askedQuestions: this.askedQuestions,
        context: this.context,
        routeData: this.routeData,
        lastUserMessage: this.lastUserMessage,
        lastAuraResponse: this.lastAuraResponse
      };
      sessionStorage.setItem(this.storageKey, JSON.stringify(state));
    } catch (e) {
      console.warn('Could not save Aura session state to sessionStorage.');
    }
  }

  addMessage(role, content, metadata = {}) {
    const message = {
      role,
      content,
      timestamp: new Date().toISOString(),
      metadata
    };
    this.conversationHistory.push(message);

    if (role === 'user') {
      this.lastUserMessage = content;
    } else if (role === 'aura') {
      this.lastAuraResponse = content;
    }

    this.saveSession();
    return message;
  }

  /**
   * Context reset detection:
   * - New intent type → full reset
   * - Same intent but different destination/origin → full reset
   * - New currency/budget/duration → merge into existing context (no reset)
   */
  updateContext(parsed, rawInput) {
    const prevIntent = this.context.intent;
    const newIntent = parsed.intent;

    const isNewIntent = newIntent && newIntent !== 'travel_advice' && newIntent !== prevIntent;
    const isNewDestination = parsed.destination && parsed.destination !== this.context.destination;
    const isNewSource = parsed.sourceCity && parsed.sourceCity !== this.context.sourceCity;

    // Intents that represent discrete trips — trigger context wipe when switching
    const tripIntents = ['trip_planning', 'route_comparison', 'road_trip'];
    const isTripIntent = tripIntents.includes(newIntent);
    const prevIsTripIntent = tripIntents.includes(prevIntent);

    const text = (rawInput || '').toLowerCase().trim();
    const isGenericStart = (newIntent === 'trip_planning' && (text === 'plan trip' || text === 'plan a trip' || text === 'start planning' || text === 'trip planner')) ||
                           (newIntent === 'route_comparison' && (text === 'compare routes' || text === 'route planner' || text === 'directions'));

    if (isGenericStart) {
      console.log('🔄 AURA_CONTEXT_RESET: Generic planning trigger detected:', text);
      this.reset(false);
      this.context.intent = newIntent;
    } else {
      // RESET: switching between trip intent types (e.g. trip_planning → route_comparison)
      if (isTripIntent && prevIsTripIntent && isNewIntent) {
        console.log('🔄 AURA_CONTEXT_RESET: Intent type changed from', prevIntent, '→', newIntent);
        this.context = { ...this.defaultState.context, intent: newIntent };
        this.askedQuestions = [];
      }
      // RESET: same or new trip intent but destination changed (new trip request)
      else if (isTripIntent && (isNewDestination || isNewSource)) {
        console.log('🔄 AURA_CONTEXT_RESET: New destination/source detected');
        this.context = { ...this.defaultState.context, intent: newIntent || prevIntent };
        this.askedQuestions = [];
      }
    }

    // Merge parsed fields into context
    if (newIntent && newIntent !== 'travel_advice') {
      this.context.intent = newIntent;
    }

    const fieldsToMerge = [
      'sourceCity', 'destination', 'country', 'budget',
      'duration', 'dates', 'travelers', 'transportPreference',
      'hotelPreference', 'travelStyle'
    ];

    fieldsToMerge.forEach(field => {
      if (parsed[field] !== null && parsed[field] !== undefined) {
        // Prevent overwriting valid fields with potentially unrelated/erroneous parser extraction
        if (this.context[field] !== null && this.context[field] !== parsed[field]) {
           // Only allow overwrite if we're in a trip planning state and it's an explicit route change
           if (isTripIntent && (isNewDestination || isNewSource)) {
              this.context[field] = parsed[field];
           }
        } else {
          this.context[field] = parsed[field];
        }
      }
    });

    // Handle currency separately — merge the currency object cleanly
    if (parsed.currency) {
      this.context.currency = parsed.currency;
      // Also update budget's currency if budget was set without one
      if (this.context.budget && !this.context.budget.currency) {
        this.context.budget.currency = parsed.currency.code;
      }
    }

    // If budget arrived without currency, keep budget.currency as null
    // (engine will ask for currency next)

    this.saveSession();
  }

  /**
   * Returns missing required fields for the current intent.
   *
   * Required (blocking):
   *   trip_planning → destination, sourceCity, currency, budget, duration
   *   route_comparison / road_trip → destination, sourceCity
   *   hotel_search → destination
   *   budget_estimation → destination, currency, budget
   *
   * Optional (asked only when they would meaningfully improve planning):
   *   transportPreference, travelers
   */
  getMissingInformation(intentToCheck) {
    const missing = [];
    const required = [];
    const intent = intentToCheck || this.context.intent;

    if (intent === 'route_comparison' || intent === 'road_trip') {
      required.push('sourceCity', 'destination');
      if (!this.context.sourceCity) missing.push('sourceCity');
      if (!this.context.destination) missing.push('destination');
      return { missing, required };
    }

    if (intent === 'hotel_search') {
      required.push('destination');
      if (!this.context.destination) missing.push('destination');
      return { missing, required };
    }

    if (intent === 'budget_estimation') {
      required.push('destination', 'currency', 'budget');
      if (!this.context.destination) missing.push('destination');
      if (!this.context.currency) missing.push('currency');
      if (!this.context.budget) missing.push('budget');
      return { missing, required };
    }

    if (intent === 'trip_planning') {
      // STRICT ORDER: destination -> sourceCity -> duration -> budget -> [currency if needed]
      required.push('destination', 'sourceCity', 'duration', 'budget');
      
      if (!this.context.destination) {
        missing.push('destination');
      } else if (!this.context.sourceCity) {
        missing.push('sourceCity');
      } else if (!this.context.duration) {
        missing.push('duration');
      } else if (!this.context.budget) {
        missing.push('budget');
      } else {
        // Currency is explicitly OPTIONAL. We can infer it (default to INR or USD).
        // Remove currency from missing/required array so it doesn't block generation.
        const budgetHasCurrency = this.context.budget && (typeof this.context.budget === 'object' ? this.context.budget.currency : null);
        if (!this.context.currency && !budgetHasCurrency) {
          // Infer INR as default if currency is entirely missing, but don't ask the user
          this.context.currency = { code: 'INR', symbol: '₹', name: 'Indian Rupee' };
          if (typeof this.context.budget === 'object') {
             this.context.budget.currency = 'INR';
          }
          this.saveSession();
        }
      }
      return { missing, required };
    }

    return { missing, required };
  }

  isReadyForPlanning() {
    const { missing } = this.getMissingInformation('trip_planning');
    return missing.length === 0;
  }

  /**
   * Smart follow-up question generator.
   * Ask the first missing field. Never ask the same field more than twice.
   */
  generateFollowUpQuestion(missing) {
    if (!missing || missing.length === 0) return "How can I help you today?";

    const questions = {
      destination: "Which city or destination would you like to visit? 🌍",
      sourceCity: "Great! Which city will you be traveling from?",
      currency: "What currency would you like to plan your budget in? (e.g. INR ₹, USD $, EUR €, GBP £, JPY ¥)",
      budget: `What's your approximate budget for this trip? (in ${this.getCurrencyLabel()})`,
      duration: "How many days are you planning to travel?",
      transportPreference: "Do you have a preferred way to travel — flight, train, road, or bus?",
      travelers: "How many people will be traveling?"
    };

    const unaskedMissing = missing.filter(field => {
      const askCount = this.askedQuestions.filter(q => q === field).length;
      return askCount < 2;
    });

    if (unaskedMissing.length > 0) {
      const fieldToAsk = unaskedMissing[0];
      this.askedQuestions.push(fieldToAsk);
      this.saveSession();
      return questions[fieldToAsk] || "Could you provide a bit more detail about your trip?";
    }

    return "I still need a few more details. Could you tell me your destination, currency preference, and approximate budget?";
  }

  /**
   * Returns currency label for budget prompt.
   */
  getCurrencyLabel() {
    if (this.context.currency) {
      return `${this.context.currency.symbol} ${this.context.currency.code}`;
    }
    return 'your preferred currency';
  }

  /**
   * Handle short follow-up answers by mapping them to the correct missing field.
   * Returns the field that was filled, or null.
   */
  resolveShortAnswer(rawInput, missing, parser) {
    if (!missing || missing.length === 0) return null;

    const field = missing[0];
    const text = rawInput.trim().toLowerCase();

    if (field === 'currency') {
      const currency = parser.extractCurrency(text);
      if (currency) {
        this.context.currency = currency;
        this.saveSession();
        return 'currency';
      }
    }

    if (field === 'budget') {
      const budget = parser.extractBudget(rawInput);
      if (budget) {
        this.context.budget = budget;
        if (!this.context.budget.currency && this.context.currency) {
          this.context.budget.currency = this.context.currency.code;
        }
        this.saveSession();
        return 'budget';
      }
    }

    if (field === 'duration') {
      const duration = parser.extractDuration(rawInput);
      if (duration) {
        this.context.duration = duration;
        this.saveSession();
        return 'duration';
      }
    }

    if (field === 'destination' || field === 'sourceCity') {
      // Make sure it's not a currency answer
      const isCurrency = parser.extractCurrency(text) !== null;
      if (!isCurrency && rawInput.split(/\s+/).length <= 3) {
        this.context[field] = parser.normalizeCity(rawInput);
        this.saveSession();
        return field;
      }
    }

    return null;
  }

  getSummary() {
    return {
      messagesCount: this.conversationHistory.length,
      context: this.context,
      lastMessage: this.lastUserMessage,
      isReadyForPlanning: this.isReadyForPlanning(),
      missing: this.getMissingInformation()
    };
  }
}

window.AuraMemory = AuraMemory;
