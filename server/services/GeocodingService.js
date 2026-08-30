/**
 * GeocodingService.js
 * 
 * Geographic Lookup & Autocomplete Intelligence Service.
 * Primary Provider: OpenRouteService Geocoder
 * Fallback Provider: OpenStreetMap Nominatim
 * 
 * Capabilities:
 *  - cityToCoordinates(cityName)
 *  - coordinatesToCity(lat, lng)
 *  - countryLookup(countryNameOrCode)
 *  - autocomplete(query, limit)
 */

const ApiManager = require('./ApiManager');
const CacheService = require('./CacheService');

class GeocodingService {
  constructor() {
    this.orsGeocodeUrl = 'https://api.openrouteservice.org/geocode';
    this.nominatimUrl = 'https://nominatim.openstreetmap.org';
  }

  getOrsKey() {
    return process.env.ORS_API_KEY || null;
  }

  /**
   * Primary Action: ORS forward geocode search.
   */
  async geocodeWithORS(text, limit = 5) {
    const apiKey = this.getOrsKey();
    if (!apiKey) throw new Error('ORS_API_KEY is not configured.');

    const url = `${this.orsGeocodeUrl}/search?api_key=${apiKey}&text=${encodeURIComponent(text)}&size=${limit}`;
    const response = await ApiManager.fetchWithTimeout(url, {}, 8000);

    if (!response.ok) {
      throw new Error(`ORS Geocode HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      return [];
    }

    return data.features.map(f => ({
      name: f.properties.name || f.properties.label,
      label: f.properties.label,
      city: f.properties.locality || f.properties.county || f.properties.name,
      region: f.properties.region,
      country: f.properties.country,
      countryCode: f.properties.country_a,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0],
      confidence: f.properties.confidence || null
    }));
  }

  /**
   * Fallback Action: Nominatim forward geocode search.
   */
  async geocodeWithNominatim(text, limit = 5) {
    const url = `${this.nominatimUrl}/search?format=json&q=${encodeURIComponent(text)}&limit=${limit}&addressdetails=1`;
    const response = await ApiManager.fetchWithTimeout(url, {
      headers: { 'User-Agent': 'GlobeRoutes-Tourism-App/1.0 (info@globeroutes.co)' }
    }, 8000);

    if (!response.ok) {
      throw new Error(`Nominatim Geocode HTTP ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map(item => ({
      name: item.name || item.display_name.split(',')[0],
      label: item.display_name,
      city: item.address?.city || item.address?.town || item.address?.village || item.name,
      region: item.address?.state || item.address?.county,
      country: item.address?.country,
      countryCode: item.address?.country_code ? item.address.country_code.toUpperCase() : null,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      confidence: item.importance || null
    }));
  }

  /**
   * Primary Action: ORS Reverse geocode.
   */
  async reverseWithORS(lat, lng) {
    const apiKey = this.getOrsKey();
    if (!apiKey) throw new Error('ORS_API_KEY is not configured.');

    const url = `${this.orsGeocodeUrl}/reverse?api_key=${apiKey}&point.lat=${lat}&point.lon=${lng}&size=1`;
    const response = await ApiManager.fetchWithTimeout(url, {}, 8000);

    if (!response.ok) throw new Error(`ORS Reverse Geocode HTTP ${response.status}`);

    const data = await response.json();
    if (!data.features || data.features.length === 0) {
      throw new Error('No features found for reverse geocoding');
    }

    const f = data.features[0];
    return {
      label: f.properties.label,
      city: f.properties.locality || f.properties.name,
      region: f.properties.region,
      country: f.properties.country,
      countryCode: f.properties.country_a,
      lat: f.geometry.coordinates[1],
      lng: f.geometry.coordinates[0]
    };
  }

  /**
   * Fallback Action: Nominatim Reverse geocode.
   */
  async reverseWithNominatim(lat, lng) {
    const url = `${this.nominatimUrl}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const response = await ApiManager.fetchWithTimeout(url, {
      headers: { 'User-Agent': 'GlobeRoutes-Tourism-App/1.0 (info@globeroutes.co)' }
    }, 8000);

    if (!response.ok) throw new Error(`Nominatim Reverse HTTP ${response.status}`);

    const data = await response.json();
    if (!data || !data.address) throw new Error('No address found for reverse geocoding');

    return {
      label: data.display_name,
      city: data.address.city || data.address.town || data.address.village || data.address.county || 'Unknown',
      region: data.address.state,
      country: data.address.country,
      countryCode: data.address.country_code ? data.address.country_code.toUpperCase() : null,
      lat: parseFloat(data.lat),
      lng: parseFloat(data.lon)
    };
  }

  /**
   * Autocomplete location search query.
   */
  async autocomplete(query, limit = 5) {
    if (!query || query.trim().length < 2) {
      return {
        success: false,
        provider: 'None',
        error: 'query must be at least 2 characters'
      };
    }

    const cacheKey = `geocode:autocomplete:${query.toLowerCase().trim()}:${limit}`;

    return await ApiManager.executeWithFallback({
      primaryProvider: 'OpenRouteService',
      fallbackProvider: 'Nominatim',
      cacheKey,
      cacheTtl: CacheService.TTL.GEOCODE,
      primaryAction: () => this.geocodeWithORS(query, limit),
      fallbackAction: () => this.geocodeWithNominatim(query, limit)
    });
  }

  /**
   * Converts a city name to coordinates.
   */
  async cityToCoordinates(cityName) {
    if (!cityName) {
      return {
        success: false,
        provider: 'None',
        error: 'cityName is required'
      };
    }

    const cacheKey = `geocode:city:${cityName.toLowerCase().trim()}`;

    return await ApiManager.executeWithFallback({
      primaryProvider: 'OpenRouteService',
      fallbackProvider: 'Nominatim',
      cacheKey,
      cacheTtl: CacheService.TTL.GEOCODE,
      primaryAction: async () => {
        const results = await this.geocodeWithORS(cityName, 1);
        if (!results || results.length === 0) throw new Error(`City '${cityName}' not found`);
        return results[0];
      },
      fallbackAction: async () => {
        const results = await this.geocodeWithNominatim(cityName, 1);
        if (!results || results.length === 0) throw new Error(`City '${cityName}' not found`);
        return results[0];
      }
    });
  }

  /**
   * Converts coordinates to a city / location details.
   */
  async coordinatesToCity(lat, lng) {
    if (!lat || !lng) {
      return {
        success: false,
        provider: 'None',
        error: 'lat and lng parameters are required'
      };
    }

    const cacheKey = `geocode:reverse:${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;

    return await ApiManager.executeWithFallback({
      primaryProvider: 'OpenRouteService',
      fallbackProvider: 'Nominatim',
      cacheKey,
      cacheTtl: CacheService.TTL.GEOCODE,
      primaryAction: () => this.reverseWithORS(lat, lng),
      fallbackAction: () => this.reverseWithNominatim(lat, lng)
    });
  }

  /**
   * Look up country details and bounding box.
   */
  async countryLookup(countryNameOrCode) {
    if (!countryNameOrCode) {
      return {
        success: false,
        provider: 'None',
        error: 'countryNameOrCode is required'
      };
    }

    return this.cityToCoordinates(countryNameOrCode);
  }
}

// Export singleton instance
module.exports = new GeocodingService();
