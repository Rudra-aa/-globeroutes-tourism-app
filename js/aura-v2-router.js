/**
 * Aura V2 Route Intelligence Engine
 * Handles road routes, train routes, flight routes, and multi-modal routing
 */

class AuraRouter {
  constructor() {
    this.osmUrl = 'https://router.project-osrm.org/route/v1';
    this.openRouteUrl = 'https://api.openrouteservice.org/v2/directions';
    this.routeData = null;
    this.routeOptions = {
      road: [],
      train: [],
      flight: [],
      multimodal: []
    };
  }

  /**
   * Get coordinates for a city (mock data - use geocoding API for production)
   */
  async getCityCoordinates(cityName) {
    // Mock database of Indian cities
    const cityCoords = {
      'delhi': { lat: 28.7041, lng: 77.1025, name: 'Delhi' },
      'mumbai': { lat: 19.0760, lng: 72.8777, name: 'Mumbai' },
      'gwalior': { lat: 26.2183, lng: 78.1711, name: 'Gwalior' },
      'goa': { lat: 15.2993, lng: 73.8243, name: 'Goa' },
      'bangalore': { lat: 12.9716, lng: 77.5946, name: 'Bangalore' },
      'agra': { lat: 27.1767, lng: 78.0081, name: 'Agra' },
      'jaipur': { lat: 26.9124, lng: 75.7873, name: 'Jaipur' },
      'manali': { lat: 32.2396, lng: 77.1887, name: 'Manali' },
      'shimla': { lat: 31.7724, lng: 77.1693, name: 'Shimla' },
      'leh': { lat: 34.1526, lng: 77.5770, name: 'Leh' },
      'udaipur': { lat: 24.5854, lng: 73.7125, name: 'Udaipur' },
      'dubai': { lat: 25.2048, lng: 55.2708, name: 'Dubai' },
      'rajasthan': { lat: 27.5922, lng: 77.1092, name: 'Rajasthan' }
    };

    const key = cityName.toLowerCase().trim();
    return cityCoords[key] || null;
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Get road route using OSRM
   */
  async getRoadRoute(source, destination) {
    try {
      const srcCoords = await this.getCityCoordinates(source);
      const dstCoords = await this.getCityCoordinates(destination);

      if (!srcCoords || !dstCoords) {
        return this.mockRoadRoute(source, destination);
      }

      // Use OSRM for actual route
      const url = `${this.osmUrl}/driving/${srcCoords.lng},${srcCoords.lat};${dstCoords.lng},${dstCoords.lat}?overview=full&steps=true`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.routes && data.routes[0]) {
        const route = data.routes[0];
        return {
          type: 'road',
          source: srcCoords.name,
          destination: dstCoords.name,
          distance: Math.round(route.distance / 1000), // km
          duration: Math.round(route.duration / 3600), // hours
          estimatedCost: this.estimateRoadCost(Math.round(route.distance / 1000)),
          geometry: route.geometry,
          steps: route.legs[0].steps || []
        };
      } else {
        return this.mockRoadRoute(source, destination);
      }
    } catch (error) {
      console.error('Error fetching road route:', error);
      return this.mockRoadRoute(source, destination);
    }
  }

  /**
   * Get train route (mock data)
   */
  async getTrainRoute(source, destination) {
    // Mock train route data
    return {
      type: 'train',
      source: this.capitalizeCity(source),
      destination: this.capitalizeCity(destination),
      distance: this.mockDistance(source, destination),
      duration: this.mockTrainDuration(source, destination),
      costMin: this.mockTrainCost(source, destination) * 0.8,
      costMax: this.mockTrainCost(source, destination) * 1.5,
      trainName: 'Express 123',
      departureTime: '10:30 PM',
      arrivalTime: '08:45 AM (Next Day)',
      class: ['AC 1st', 'AC 2-Tier', '3-Tier', 'SL'],
      stations: [
        { name: this.capitalizeCity(source) + ' Station', time: '10:30 PM' },
        { name: 'Intermediate Station 1', time: '2:15 AM' },
        { name: 'Intermediate Station 2', time: '5:45 AM' },
        { name: this.capitalizeCity(destination) + ' Station', time: '08:45 AM' }
      ]
    };
  }

  /**
   * Get flight route (mock data)
   */
  async getFlightRoute(source, destination) {
    return {
      type: 'flight',
      source: this.capitalizeCity(source),
      destination: this.capitalizeCity(destination),
      distance: this.mockDistance(source, destination),
      duration: this.mockFlightDuration(source, destination),
      costMin: this.mockFlightCost(source, destination) * 0.9,
      costMax: this.mockFlightCost(source, destination) * 1.3,
      airline: 'IndiGo',
      flightNumber: 'IG 801',
      departureTime: '08:00 AM',
      arrivalTime: '10:30 AM',
      stops: 0,
      aircraft: 'Boeing 737'
    };
  }

  /**
   * Get multi-modal route
   */
  async getMultimodalRoute(source, destination) {
    const road = await this.getRoadRoute(source, destination);
    const train = await this.getTrainRoute(source, destination);
    const flight = await this.getFlightRoute(source, destination);

    return {
      type: 'multimodal',
      options: [
        { ...road, recommended: road.duration <= 8 },
        { ...train, recommended: train.duration <= 24 },
        { ...flight, recommended: flight.costMin <= road.costMin * 1.2 }
      ]
    };
  }

  /**
   * Compare all route options via Backend API (OpenRouteService Integrated)
   */
  async compareRoutes(source, destination) {
    const backendUrl = window.BACKEND_URL || 'http://localhost:5001';
    
    try {
      const srcCoords = await this.getCityCoordinates(source);
      const dstCoords = await this.getCityCoordinates(destination);

      const response = await fetch(`${backendUrl}/api/aura/v2/routes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: this.capitalizeCity(source),
          destination: this.capitalizeCity(destination),
          sourceCoords: srcCoords,
          destCoords: dstCoords
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Add ranking logic locally
        const ranked = data.options
          .map((route, idx) => ({
            ...route,
            rank: idx + 1,
            cheapest: route.type === 'train',
            fastest: route.type === 'flight',
            mostComfortable: route.type === 'road'
          }))
          .sort((a, b) => {
            if (a.recommended && !b.recommended) return -1;
            if (!a.recommended && b.recommended) return 1;
            return a.duration - b.duration;
          });

        return {
          source: this.capitalizeCity(source),
          destination: this.capitalizeCity(destination),
          totalOptions: ranked.length,
          routes: ranked,
          cheapest: ranked.find(r => r.type === 'train') || ranked[0],
          fastest: ranked.find(r => r.type === 'flight') || ranked[0],
          recommended: ranked[0]
        };
      }
    } catch(err) {
      console.error('Failed to get routes from backend:', err);
    }

    // Fallback if backend fails
    const routes = await this.getMultimodalRoute(source, destination);
    
    const ranked = routes.options
      .map((route, idx) => ({
        ...route,
        rank: idx + 1,
        cheapest: route.type === 'train',
        fastest: route.type === 'flight',
        mostComfortable: route.type === 'road'
      }))
      .sort((a, b) => {
        if (a.recommended && !b.recommended) return -1;
        if (!a.recommended && b.recommended) return 1;
        return a.duration - b.duration;
      });

    return {
      source: this.capitalizeCity(source),
      destination: this.capitalizeCity(destination),
      totalOptions: ranked.length,
      routes: ranked,
      cheapest: ranked.filter(r => r.type === 'train')[0],
      fastest: ranked.filter(r => r.type === 'flight')[0],
      recommended: ranked[0]
    };
  }

  // --- Helper Methods ---

  mockRoadRoute(source, destination) {
    const distance = this.mockDistance(source, destination);
    return {
      type: 'road',
      source: this.capitalizeCity(source),
      destination: this.capitalizeCity(destination),
      distance,
      duration: Math.ceil(distance / 65), // Average 65 km/h
      costMin: this.estimateRoadCost(distance) * 0.9,
      costMax: this.estimateRoadCost(distance) * 1.2,
      geometry: { coordinates: [] }
    };
  }

  mockDistance(source, destination) {
    // Simple mock based on common Indian routes
    const distances = {
      'gwalior-goa': 1250,
      'goa-gwalior': 1250,
      'delhi-goa': 1550,
      'goa-delhi': 1550,
      'mumbai-delhi': 1400,
      'delhi-mumbai': 1400,
      'delhi-agra': 206,
      'agra-delhi': 206,
      'delhi-jaipur': 262,
      'jaipur-delhi': 262,
      'manali-delhi': 543,
      'delhi-manali': 543,
      'leh-delhi': 1018,
      'delhi-leh': 1018
    };

    const key = (source.toLowerCase() + '-' + destination.toLowerCase()).replace(/\s/g, '');
    return distances[key] || 500 + Math.random() * 1500;
  }

  mockTrainDuration(source, destination) {
    const distance = this.mockDistance(source, destination);
    return Math.ceil(distance / 55); // Average 55 km/h for trains
  }

  mockFlightDuration(source, destination) {
    // Flight duration ~1-3 hours for Indian routes
    return 2 + (Math.random() * 1);
  }

  mockTrainCost(source, destination) {
    const distance = this.mockDistance(source, destination);
    return Math.ceil(distance * 0.50); // ~₹0.50 per km
  }

  mockFlightCost(source, destination) {
    const distance = this.mockDistance(source, destination);
    return Math.ceil(distance * 1.50 + (Math.random() * 5000)); // Base + variation
  }

  estimateRoadCost(distance) {
    // Estimate by fuel/vehicle hire: ₹8-12 per km
    return Math.ceil(distance * 10);
  }

  capitalizeCity(city) {
    return city.charAt(0).toUpperCase() + city.slice(1).toLowerCase();
  }
}

// Export for use in other modules
window.AuraRouter = AuraRouter;
