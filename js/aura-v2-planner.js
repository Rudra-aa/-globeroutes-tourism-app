/**
 * Aura V2 Travel Planner Engine
 * Generates itineraries, budgets, and travel recommendations
 */

class AuraTravelPlanner {
  constructor() {
    this.attractions = {};
    this.hotels = {};
    this.restaurants = {};
  }

  /**
   * Generate complete trip plan
   */
  async generateTripPlan(context) {
    if (!context.destination || !context.duration) {
      return null;
    }

    const plan = {
      destination: context.destination,
      duration: context.duration,
      travelers: context.travelers,
      budget: context.budget,
      itinerary: await this.generateItinerary(context),
      budget_breakdown: this.generateBudgetBreakdown(context),
      attractions: await this.getAttractions(context.destination),
      hotels: await this.suggestHotels(context),
      food: await this.getFoodRecommendations(context.destination),
      safety_tips: this.getSafetyTips(context.destination),
      best_season: this.getBestSeason(context.destination),
      packing_tips: this.getPackingTips(context.destination, context.travelStyle)
    };

    return plan;
  }

  /**
   * Generate day-wise itinerary
   */
  async generateItinerary(context) {
    const itinerary = [];
    const dest = context.destination.toLowerCase();

    // Sample activities by destination
    const activities = {
      'goa': [
        'Explore Baga Beach',
        'Visit Church of St. Cajetan',
        'Spice plantation tour',
        'Water sports activities',
        'Night club or beach bar',
        'Anjuna Flea Market'
      ],
      'delhi': [
        'Visit India Gate',
        'Explore Red Fort',
        'Visit Jama Masjid',
        'Shopping at Connaught Place',
        'Visit Humayun\'s Tomb',
        'Explore Chandni Chowk'
      ],
      'agra': [
        'Sunrise at Taj Mahal',
        'Agra Fort visit',
        'Mehtab Bagh view',
        'Explore local markets'
      ],
      'jaipur': [
        'City Palace tour',
        'Hawa Mahal visit',
        'Jantar Mantar astronomy',
        'Local bazaars'
      ]
    };

    const destActivities = activities[dest] || activities['goa'];

    for (let day = 1; day <= context.duration; day++) {
      const dayActivities = [];
      const activitiesPerDay = Math.ceil(destActivities.length / context.duration);

      for (let i = 0; i < activitiesPerDay; i++) {
        const idx = (day - 1) * activitiesPerDay + i;
        if (destActivities[idx]) {
          dayActivities.push(destActivities[idx]);
        }
      }

      itinerary.push({
        day,
        title: `Day ${day} in ${this.capitalizeCity(dest)}`,
        activities: dayActivities,
        meals: this.suggestMeals(day, context.duration),
        accommodation: this.capitalizeCity(dest) + ' (Hotel)'
      });
    }

    return itinerary;
  }

  /**
   * Generate budget breakdown
   */
  generateBudgetBreakdown(context) {
    if (!context.budget || !context.budget.amount) {
      return null;
    }

    const totalBudget = context.budget.amount;
    const travelers = context.travelers || 1;
    const perPerson = Math.floor(totalBudget / travelers);

    const breakdown = {
      total_budget: totalBudget,
      per_person: perPerson,
      currency: '₹',
      distribution: {
        accommodation: Math.floor(perPerson * 0.30),
        food: Math.floor(perPerson * 0.20),
        transport: Math.floor(perPerson * 0.25),
        activities: Math.floor(perPerson * 0.15),
        shopping: Math.floor(perPerson * 0.05),
        contingency: Math.floor(perPerson * 0.05)
      }
    };

    // Adjust based on travel style
    if (context.travelStyle === 'luxury') {
      breakdown.distribution.accommodation = Math.floor(perPerson * 0.40);
      breakdown.distribution.food = Math.floor(perPerson * 0.25);
    } else if (context.travelStyle === 'budget') {
      breakdown.distribution.accommodation = Math.floor(perPerson * 0.20);
      breakdown.distribution.food = Math.floor(perPerson * 0.15);
      breakdown.distribution.activities = Math.floor(perPerson * 0.25);
    }

    breakdown.total_distributed = Object.values(breakdown.distribution).reduce((a, b) => a + b, 0);

    return breakdown;
  }

  /**
   * Get attractions for a destination
   */
  async getAttractions(destination) {
    const attractions = {
      'goa': [
        { name: 'Baga Beach', tier: 'red', description: 'Popular beach with water sports' },
        { name: 'Anjuna Beach', tier: 'orange', description: 'Scenic beach with cliffs' },
        { name: 'Church of St. Cajetan', tier: 'orange', description: 'Historic Portuguese church' },
        { name: 'Spice Plantations', tier: 'yellow', description: 'Traditional spice farms' }
      ],
      'delhi': [
        { name: 'India Gate', tier: 'red', description: 'Iconic war memorial' },
        { name: 'Taj Mahal', tier: 'red', description: 'Agra - Monument to love' },
        { name: 'Red Fort', tier: 'orange', description: 'Historic Mughal fortress' },
        { name: 'Jama Masjid', tier: 'orange', description: 'India\'s largest mosque' }
      ]
    };

    return attractions[destination.toLowerCase()] || attractions['goa'];
  }

  /**
   * Suggest hotels
   */
  async suggestHotels(context) {
    const hotels = {
      luxury: [
        { name: '5-Star Resort', price: 15000, rating: 4.8, amenities: ['Pool', 'Spa', 'Fine Dining'] },
        { name: 'Premium Palace', price: 12000, rating: 4.7, amenities: ['Rooftop Bar', 'Gym', 'WiFi'] }
      ],
      'mid-range': [
        { name: '3-Star Hotel', price: 4000, rating: 4.3, amenities: ['AC', 'WiFi', 'Restaurant'] },
        { name: 'Comfort Inn', price: 3500, rating: 4.2, amenities: ['24/7 Room Service', 'WiFi'] }
      ],
      budget: [
        { name: 'Budget Hotel', price: 1200, rating: 3.8, amenities: ['Clean Rooms', 'WiFi'] },
        { name: 'Hostel', price: 600, rating: 3.5, amenities: ['Shared Kitchen', 'Common Area'] }
      ]
    };

    const style = context.travelStyle === 'luxury' ? 'luxury' 
                : context.travelStyle === 'budget' ? 'budget' 
                : 'mid-range';

    return hotels[style] || hotels['mid-range'];
  }

  /**
   * Get food recommendations
   */
  async getFoodRecommendations(destination) {
    const food = {
      'goa': [
        'Fish Curry Rice',
        'Prawn Biryani',
        'Sorpotel (pork curry)',
        'Bebinca (dessert)',
        'Feni (local drink)'
      ],
      'delhi': [
        'Butter Chicken',
        'Chole Bhature',
        'Dosa',
        'Samosas',
        'Lassi'
      ]
    };

    return food[destination.toLowerCase()] || food['goa'];
  }

  /**
   * Get safety tips
   */
  getSafetyTips(destination) {
    return [
      'Keep your passport and valuables in a safe place',
      'Use registered taxis or ride-sharing apps',
      'Drink only bottled or filtered water',
      'Be aware of local customs and dress modestly in religious places',
      'Avoid traveling alone at night',
      'Keep emergency contacts handy'
    ];
  }

  /**
   * Get best season
   */
  getBestSeason(destination) {
    const seasons = {
      'goa': 'November to February (Winter)',
      'delhi': 'October to March (Winter)',
      'agra': 'October to March (Winter)',
      'manali': 'June to September (Summer)'
    };

    return seasons[destination.toLowerCase()] || 'October to March';
  }

  /**
   * Get packing tips
   */
  getPackingTips(destination, style) {
    const basePacking = [
      'Passport and travel documents',
      'Travel insurance documents',
      'Medications',
      'Comfortable shoes',
      'Weather-appropriate clothing',
      'Sunscreen and hat',
      'Camera/smartphone',
      'Power banks'
    ];

    if (style === 'beach') {
      basePacking.push('Swimwear');
      basePacking.push('Beach towel');
    }

    if (style === 'adventure') {
      basePacking.push('Trekking shoes');
      basePacking.push('First aid kit');
    }

    return basePacking;
  }

  /**
   * Suggest meals
   */
  suggestMeals(day, duration) {
    const meals = ['Breakfast', 'Lunch', 'Dinner'];
    if (day === 1) {
      return ['Lunch', 'Dinner'];
    } else if (day === duration) {
      return ['Breakfast', 'Lunch'];
    }
    return meals;
  }

  capitalizeCity(city) {
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  }
}

// Export for use in other modules
window.AuraTravelPlanner = AuraTravelPlanner;
