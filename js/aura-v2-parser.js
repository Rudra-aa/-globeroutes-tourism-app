/**
 * Aura V2 Natural Language Parser
 * Extracts travel information from free-form user input and classifies intents.
 * Data-Driven approach: No hardcoded fallback locations.
 */
class AuraParser {
  constructor() {
    // Currency symbol/code map for normalization
    this.currencyMap = {
      'inr': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      '₹': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      'rupee': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      'rupees': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      'rs': { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
      'usd': { code: 'USD', symbol: '$', name: 'US Dollar' },
      'dollar': { code: 'USD', symbol: '$', name: 'US Dollar' },
      'dollars': { code: 'USD', symbol: '$', name: 'US Dollar' },
      '$': { code: 'USD', symbol: '$', name: 'US Dollar' },
      'eur': { code: 'EUR', symbol: '€', name: 'Euro' },
      'euro': { code: 'EUR', symbol: '€', name: 'Euro' },
      'euros': { code: 'EUR', symbol: '€', name: 'Euro' },
      '€': { code: 'EUR', symbol: '€', name: 'Euro' },
      'gbp': { code: 'GBP', symbol: '£', name: 'British Pound' },
      'pound': { code: 'GBP', symbol: '£', name: 'British Pound' },
      'pounds': { code: 'GBP', symbol: '£', name: 'British Pound' },
      '£': { code: 'GBP', symbol: '£', name: 'British Pound' },
      'jpy': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      'yen': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      '¥': { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
      'sgd': { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
      'aed': { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
      'dirham': { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
      'cad': { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
      'aud': { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
      'thb': { code: 'THB', symbol: '฿', name: 'Thai Baht' },
      'baht': { code: 'THB', symbol: '฿', name: 'Thai Baht' },
      'chf': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
      'franc': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
      'francs': { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
      'try': { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
      'lira': { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
      'liras': { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
      '₺': { code: 'TRY', symbol: '₺', name: 'Turkish Lira' },
      'idr': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
      'rupiah': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
      'rupiahs': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
      'rp': { code: 'IDR', symbol: 'Rp', name: 'Indonesian Rupiah' },
      'krw': { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
      'won': { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
      '₩': { code: 'KRW', symbol: '₩', name: 'South Korean Won' },
      'vnd': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
      'dong': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
      '₫': { code: 'VND', symbol: '₫', name: 'Vietnamese Dong' },
    };

    this.patterns = {
      // Explicit route matching (from X to Y)
      routePattern: /(?:from|travel from|trip from|route(?:s)? from)[\s]+([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+for|\s+under|\s+with|\s+in|,|\.|\?|$)/i,

      // Standalone X to Y
      xToYPattern: /^([a-zA-Z\s]+?)\s+to\s+([a-zA-Z\s]+?)(?:\s+for|\s+under|\s+with|\s+in|,|\.|\?|$)/i,

      // City/Location patterns (robust extraction)
      fromPattern: /(?:from|starting\s+in|leaving|originating|source)\s+([a-zA-Z\s]+?)(?:\s+to\s+|\s+for\s+|\s+under\s+|,|\.|\?|$)/i,
      toPattern: /(?:to|visit|visiting|destination|explore|in)\s+([a-zA-Z\s]+?)(?:\s+from\s+|\s+for\s+|\s+under\s+|\s+with\s+|\s+by\s+|,|\.|\?|$)/i,

      // Country patterns (basic)
      countryPattern: /(?:in|to|explore)\s+(india|europe|usa|america|uk|france|italy|germany|spain|japan|thailand|singapore|australia|uae|switzerland|turkey|indonesia|south_korea|vietnam|korea)/i,

      // Currency pattern — must appear before budgetPattern so we parse currency first
      currencyPattern: /\b(inr|usd|eur|gbp|jpy|sgd|aed|cad|aud|thb|chf|try|idr|krw|vnd|rupees?|dollars?|euros?|pounds?|yen|dirham|baht|francs?|liras?|rupiahs?|rp|won|dong|₹|\$|€|£|¥|₺|₩|₫)\b/i,

      // Budget patterns — supports ₹/$€£¥ and plain word budgets
      budgetPattern: /(?:₹|\$|€|£|¥|₺|₩|₫|inr|usd|eur|gbp|jpy|sgd|aed|cad|aud|thb|chf|try|idr|krw|vnd|rupees?|dollars?|euros?|pounds?|yen|dirham|baht|francs?|liras?|rupiahs?|rp|won|dong|budget|under|cost|price|within|max)\s*[\s:]*([\d]+[,\d]*)\s*(cr|crore|lakh|l|thousand|k)?/i,

      // Duration patterns
      durationPattern: /(\d+)[-\s]*(?:day|night|week|month)s?/i,

      // Date patterns
      datePattern: /(?:on|in|around)\s+(january|february|march|april|may|june|july|august|september|october|november|december|next\s+week|next\s+month|\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec))/i,

      // Transport patterns
      transportPattern: /(?:by\s+)?(?:train|flight|air|plane|road|bus|car|taxi|bike|cycle)/i,

      // Hotel preference
      hotelPattern: /(?:hotel|accommodation|stay|lodge)\s+(\w+)/i,

      // Travel style
      stylePattern: /(?:luxury|budget|adventure|cultural|beach|mountain|offbeat|backpacking|family|honeymoon)/i,

      // Number of travelers
      travelersPattern: /(?:for\s+)?(\d+)\s+(?:person|people|traveler|tourist|me\s+and)/i
    };

    this.transportModes = ['train', 'flight', 'road', 'bus', 'car'];
    this.hotelTypes = ['luxury', 'budget', 'midrange', 'resort', 'hostel', 'heritage'];
    this.travelStyles = ['luxury', 'budget', 'adventure', 'cultural', 'beach', 'mountain', 'offbeat', 'backpacking', 'family', 'honeymoon'];
  }

  /**
   * Parse user message and extract travel information
   */
  parse(userMessage) {
    const text = userMessage.toLowerCase().trim();
    const intent = this.detectIntent(text);

    // Explicit route pattern first
    const routeMatch = text.match(this.patterns.routePattern) || text.match(this.patterns.xToYPattern);
    let explicitSource = null;
    let explicitDestination = null;

    if (routeMatch) {
      explicitSource = this.normalizeCity(routeMatch[1].trim());
      explicitDestination = this.normalizeCity(routeMatch[2].trim());
    }

    const result = {
      sourceCity: explicitSource || this.extractCity(text, 'from'),
      destination: explicitDestination || this.extractCity(text, 'to'),
      country: this.extractCountry(text),
      currency: this.extractCurrency(text),
      budget: this.extractBudget(text),
      duration: this.extractDuration(text),
      dates: this.extractDates(text),
      transportPreference: this.extractTransport(text),
      hotelPreference: this.extractHotel(text),
      travelStyle: this.extractStyle(text),
      travelers: this.extractTravelers(text),
      intent: intent
    };

    return result;
  }

  extractCity(text, position) {
    if (/\d/.test(text)) return null;
    const pattern = position === 'from' ? this.patterns.fromPattern : this.patterns.toPattern;
    const match = text.match(pattern);

    if (match) {
      const rawMatch = match[1];
      if (rawMatch) {
        const city = rawMatch.trim();
        const forbiddenWords = ['compare', 'route', 'plan', 'trip', 'budget', 'hotel', 'show', 'find', 'get', 'want', 'my'];
        if (!forbiddenWords.some(w => city.toLowerCase() === w || city.toLowerCase().includes(w + ' '))) {
          return this.normalizeCity(city);
        }
      }
    }

    // Check if input is JUST a single word (e.g. answering "Which city?")
    if (text.split(/\s+/).length <= 2 && !text.match(/(?:day|night|week|month|budget|hotel|₹|\$|€|£|¥)/i)) {
      const actionWords = ['plan', 'compare', 'show', 'hi', 'hello', 'inr', 'usd', 'eur', 'gbp', 'jpy', 'trip', 'plan trip', 'start planning', 'trip planner', 'help', 'reset'];
      if (!actionWords.includes(text)) {
        return this.normalizeCity(text);
      }
    }

    return null;
  }

  normalizeCity(city) {
    const cityMap = {
      'gwl': 'gwalior', 'gwr': 'gwalior', 'mumbai': 'mumbai', 'bombay': 'mumbai',
      'ncr': 'delhi', 'raj': 'rajasthan', 'maharashtra': 'maharashtra',
      'bkk': 'bangkok', 'cnx': 'chiang mai', 'hkt': 'phuket', 'sg': 'singapore_city',
      'fra': 'frankfurt', 'muc': 'munich', 'txl': 'berlin', 'ber': 'berlin',
      'zrh': 'zurich', 'gva': 'geneva', 'luz': 'lucerne', 'ist': 'istanbul',
      'ayt': 'antalya', 'bjv': 'bodrum', 'ch': 'zurich', 'de': 'berlin', 'tr': 'istanbul',
      'sel': 'seoul', 'icn': 'incheon', 'pus': 'busan', 'cju': 'jeju',
      'han': 'hanoi', 'sgn': 'ho_chi_minh_city', 'hcm': 'ho_chi_minh_city', 'dad': 'da_nang',
      'kr': 'seoul', 'vn': 'hanoi'
    };
    const lower = city.toLowerCase().trim();
    const formatted = (cityMap[lower] || lower)
      .split(' ')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    return formatted;
  }

  extractCountry(text) {
    const match = text.match(this.patterns.countryPattern);
    return match ? match[1].trim() : null;
  }

  extractDates(text) {
    const match = text.match(this.patterns.datePattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Detect currency from input — returns normalized currency object or null
   */
  extractCurrency(text) {
    const match = text.match(this.patterns.currencyPattern);
    if (match) {
      const key = match[1].toLowerCase();
      return this.currencyMap[key] || null;
    }
    return null;
  }

  /**
   * Extract budget amount and infer currency from context
   */
  extractBudget(text) {
    let match = text.match(this.patterns.budgetPattern);
    if (!match && text.split(/\s+/).length <= 3 && !text.match(/day|night|week|month/i)) {
      match = text.match(/^(\d+[,\d]*)\s*(cr|crore|lakh|l|thousand|k)?$/i);
    }
    if (match && match[1]) {
      let amount = parseInt(match[1].replace(/,/g, ''));
      const multiplier = match[2];
      if (multiplier) {
        const multipliers = {
          'cr': 10000000, 'crore': 10000000,
          'lakh': 100000, 'l': 100000,
          'thousand': 1000, 'k': 1000
        };
        amount *= multipliers[multiplier.toLowerCase()] || 1;
      }

      // Try to detect inline currency from the budget string itself
      const inlineCurrency = this.extractCurrency(text);
      return {
        amount: amount,
        currency: inlineCurrency ? inlineCurrency.code : null  // null = will use session currency
      };
    }
    return null;
  }

  extractDuration(text) {
    const match = text.match(this.patterns.durationPattern);
    if (match && match[1]) return parseInt(match[1]);
    const rawNumMatch = text.match(/^(\d+)$/);
    if (rawNumMatch) return parseInt(rawNumMatch[1]);
    return null;
  }

  extractTransport(text) {
    for (const mode of this.transportModes) {
      if (text.includes(mode)) return mode;
    }
    return null;
  }

  extractHotel(text) {
    for (const type of this.hotelTypes) {
      if (text.includes(type)) return type;
    }
    return null;
  }

  extractStyle(text) {
    for (const style of this.travelStyles) {
      if (text.includes(style)) return style;
    }
    return null;
  }

  extractTravelers(text) {
    const match = text.match(this.patterns.travelersPattern);
    return match && match[1] ? parseInt(match[1]) : null;
  }

  detectIntent(text) {
    if (/(?:compare|vs|cheapest|fastest|train vs flight|flight vs train|options from|travel from)/i.test(text)) return 'route_comparison';
    if (/(?:road trip|drive to|driving|car to)/i.test(text)) return 'road_trip';
    if (/(?:attraction|place|thing|see|visit|route|direction|path|map|show me how|plan|itinerary|trip|tour)/i.test(text) && !/(?:suggest|recommend|where should i|ideas for|destinations for)/i.test(text)) return 'trip_planning';
    if (/(?:budget|cost|expense|price|under ₹|under r|cheap)/i.test(text)) return 'budget_estimation';
    if (/(?:hidden gem|secret|unexplored|offbeat)/i.test(text)) return 'hidden_gems';
    if (/(?:hotel|stay|accommodation|lodge|resort|hostel)/i.test(text)) return 'hotel_search';
    if (/(?:food|eat|restaurant|cuisine|cafe|dish)/i.test(text)) return 'food_discovery';
    if (/(?:suggest|recommend|where should i|ideas for|destinations for|places to go|where to go|honeymoon destinations)/i.test(text)) return 'destination_recommendation';

    return 'travel_advice';
  }
}

window.AuraParser = AuraParser;
