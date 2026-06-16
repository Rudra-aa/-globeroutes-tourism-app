/**
 * Aura V2 Travel Planner Engine
 * STRICT DATA POLICY: Never fabricate specific attractions/hotels if they are unknown. 
 * Must search GlobeRoutes data first. If zero results, fail gracefully.
 */
class AuraTravelPlanner {
  constructor() {
    this.backendUrl = window.BACKEND_URL || 'http://localhost:5001';
  }

  async generateTripPlan(context) {
    if (!context.destination || !context.duration) {
      return null;
    }

    // Must always search GlobeRoutes data before generating itinerary
    let dynamicData = await this.fetchDynamicData(context.destination);
    
    // If dataset results are zero: show dataset search failure.
    if (!dynamicData || (!dynamicData.activities && !dynamicData.attractions)) {
       return { error: 'DATASET_SEARCH_FAILURE' };
    }

    const plan = {
      destination: context.destination,
      duration: context.duration,
      travelers: context.travelers,
      budget: context.budget,
      itinerary: this.generateItinerary(context, dynamicData.activities || []),
      budget_breakdown: this.generateBudgetBreakdown(context),
      attractions: dynamicData.attractions || [],
      hotels: dynamicData.hotels || [],
      food: dynamicData.food || [],
      confidence: 'Verified Data',
      counts: {
        attractions: (dynamicData.attractions || []).length,
        hotels: (dynamicData.hotels || []).length,
        dataset: Object.keys(dynamicData).length
      },
      meta: dynamicData.meta || { local_results_count: 0, api_results_count: 0, merged_results_count: 0 }
    };

    return plan;
  }

  async fetchDynamicData(destination) {
    const destLower = destination.toLowerCase().trim();
    
    // 1. Search Verified Dataset via DatasetLoader
    let cityData = null;
    if (window.DatasetLoader) {
      cityData = await window.DatasetLoader.searchCityData(destLower);
    }

    if (!cityData) {
      // 2. Strict Check: If no verified data found, fail gracefully. No AI hallucinations allowed.
      console.warn(`AuraTravelPlanner: No verified dataset found for ${destination}`);
      return null;
    }

    const localAttractions = cityData.attractions || [];
    const localHotels = cityData.hotels || [];
    const localFood = cityData.restaurants || [];

    let dynamicData = {
       attractions: localAttractions,
       activities: localAttractions.map(a => `Visit ${a.name} - ${a.type || 'Attraction'}`),
       hotels: localHotels,
       food: localFood,
       meta: {
         local_results_count: localAttractions.length,
         api_results_count: 0,
         merged_results_count: localAttractions.length + localHotels.length + localFood.length
       }
    };

    if (dynamicData.attractions.length === 0 && dynamicData.activities.length === 0) {
        return null;
    }
    
    return dynamicData;
  }

  generateItinerary(context, activitiesPool) {
    if (activitiesPool.length === 0) return [];
    
    const itinerary = [];
    const dest = this.capitalizeCity(context.destination);

    for (let day = 1; day <= context.duration; day++) {
      const dayActivities = [];
      const activitiesPerDay = Math.ceil(activitiesPool.length / context.duration) || 1;

      for (let i = 0; i < activitiesPerDay; i++) {
        const idx = (day - 1) * activitiesPerDay + i;
        if (activitiesPool[idx]) {
          dayActivities.push(activitiesPool[idx]);
        }
      }

      itinerary.push({
        day,
        title: `Day ${day} in ${dest}`,
        activities: dayActivities,
        meals: this.suggestMeals(day, context.duration),
        accommodation: `${dest} (Hotel)`
      });
    }

    return itinerary;
  }

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

  suggestMeals(day, duration) {
    const meals = ['Breakfast', 'Lunch', 'Dinner'];
    if (day === 1) return ['Lunch', 'Dinner'];
    if (day === duration) return ['Breakfast', 'Lunch'];
    return meals;
  }

  capitalizeCity(city) {
    if (!city) return '';
    return city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
}

window.AuraTravelPlanner = AuraTravelPlanner;
