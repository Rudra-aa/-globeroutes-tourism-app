/**
 * RouteIntelligence.js
 * 
 * Shared Frontend Service Client Layer for GlobeRoutes.
 * Communicates strictly with backend proxy endpoints:
 *  - /api/routes
 *  - /api/places
 *  - /api/weather
 *  - /api/flights
 *  - /api/geocode
 * 
 * Never calls external APIs directly from the browser.
 */

class RouteIntelligenceService {
  constructor() {
    this.routesBase = '/api/routes';
    this.placesBase = '/api/places';
    this.weatherBase = '/api/weather';
    this.flightsBase = '/api/flights';
    this.geocodeBase = '/api/geocode';
  }

  /**
   * Helper to unwrap standard backend response envelope: { success, provider, data, error }
   */
  unwrap(json) {
    if (!json) return null;
    if (json.success !== undefined && json.data !== undefined) {
      return json.data;
    }
    return json;
  }

  /**
   * Fetches driving route from backend RouteService (ORS / OSRM fallback)
   */
  async getRoadRoute(sourceCoords, destCoords) {
    try {
      const response = await fetch(`${this.routesBase}/road`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCoords, destCoords })
      });
      if (!response.ok) throw new Error(`Road route fetch failed HTTP ${response.status}`);
      const json = await response.json();
      return this.unwrap(json);
    } catch (err) {
      console.error('RouteIntelligence [Road]:', err.message);
      return null;
    }
  }

  /**
   * Fetches walking route from backend RouteService
   */
  async getWalkingRoute(sourceCoords, destCoords) {
    try {
      const response = await fetch(`${this.routesBase}/walk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCoords, destCoords })
      });
      if (!response.ok) throw new Error(`Walking route fetch failed HTTP ${response.status}`);
      const json = await response.json();
      return this.unwrap(json);
    } catch (err) {
      console.error('RouteIntelligence [Walk]:', err.message);
      return null;
    }
  }

  /**
   * Fetches cycling route from backend RouteService
   */
  async getCyclingRoute(sourceCoords, destCoords) {
    try {
      const response = await fetch(`${this.routesBase}/cycle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sourceCoords, destCoords })
      });
      if (!response.ok) throw new Error(`Cycling route fetch failed HTTP ${response.status}`);
      const json = await response.json();
      return this.unwrap(json);
    } catch (err) {
      console.error('RouteIntelligence [Cycle]:', err.message);
      return null;
    }
  }

  /**
   * Fetches POIs along the route polyline via backend PlacesService
   */
  async getRoutePOIs(coordinates, categories = ['fuel', 'hotel', 'hospital', 'ev_charger']) {
    try {
      const response = await fetch(`${this.routesBase}/pois`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coordinates, categories })
      });
      if (!response.ok) throw new Error(`POIs fetch failed HTTP ${response.status}`);
      const json = await response.json();
      return this.unwrap(json) || [];
    } catch (err) {
      console.error('RouteIntelligence [POIs]:', err.message);
      return [];
    }
  }

  /**
   * Fetches nearest railway stations for a coordinate
   */
  async getNearestStations(lat, lng) {
    try {
      const response = await fetch(`${this.routesBase}/stations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (!response.ok) throw new Error(`Stations fetch failed HTTP ${response.status}`);
      const json = await response.json();
      return this.unwrap(json) || [];
    } catch (err) {
      console.error('RouteIntelligence [Stations]:', err.message);
      return [];
    }
  }

  /**
   * Fetches nearest airports for a coordinate
   */
  async getNearestAirports(lat, lng) {
    try {
      const response = await fetch(`${this.routesBase}/airports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng })
      });
      if (!response.ok) throw new Error(`Airports fetch failed HTTP ${response.status}`);
      const json = await response.json();
      return this.unwrap(json) || [];
    } catch (err) {
      console.error('RouteIntelligence [Airports]:', err.message);
      return [];
    }
  }

  /**
   * Fetches live weather for a city or coordinates
   */
  async getWeather(param) {
    try {
      let query = '';
      if (typeof param === 'string') query = `city=${encodeURIComponent(param)}`;
      else if (param && param.lat && param.lng) query = `lat=${param.lat}&lng=${param.lng}`;
      else return null;

      const response = await fetch(`${this.weatherBase}/current?${query}`);
      if (!response.ok) throw new Error(`Weather fetch failed HTTP ${response.status}`);
      const json = await response.json();
      return this.unwrap(json);
    } catch (err) {
      console.error('RouteIntelligence [Weather]:', err.message);
      return null;
    }
  }

  /**
   * Geocode a place name to coordinates
   */
  async geocode(query) {
    try {
      const response = await fetch(`${this.geocodeBase}/autocomplete?q=${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error(`Geocode fetch failed HTTP ${response.status}`);
      const json = await response.json();
      return this.unwrap(json) || [];
    } catch (err) {
      console.error('RouteIntelligence [Geocode]:', err.message);
      return [];
    }
  }
}

// Export as singleton on window
window.RouteIntelligence = new RouteIntelligenceService();
