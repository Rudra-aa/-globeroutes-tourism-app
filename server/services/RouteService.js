/**
 * RouteService.js
 * 
 * Central Route Intelligence Service.
 * Primary Provider: OpenRouteService (ORS)
 * Fallback Provider: Open Source Routing Machine (OSRM)
 * 
 * Supports:
 *  - Driving routes (driving-car / driving)
 *  - Walking routes (foot-walking / walking)
 *  - Cycling routes (cycling-regular / bike)
 *  - High-precision GeoJSON polylines, distances, durations, and fuel estimations
 */

const ApiManager = require('./ApiManager');
const CacheService = require('./CacheService');

class RouteService {
  constructor() {
    this.orsBaseUrl = 'https://api.openrouteservice.org/v2/directions';
    this.osrmBaseUrl = 'https://router.project-osrm.org/route/v1';
  }

  /**
   * Helper to get active ORS API key from environment.
   */
  getOrsKey() {
    return process.env.ORS_API_KEY || null;
  }

  /**
   * Map standard profile name to ORS and OSRM specific profile identifiers.
   */
  mapProfiles(profile = 'driving-car') {
    const map = {
      'driving-car': { ors: 'driving-car', osrm: 'driving' },
      'foot-walking': { ors: 'foot-walking', osrm: 'walking' },
      'cycling-regular': { ors: 'cycling-regular', osrm: 'bike' }
    };
    return map[profile] || map['driving-car'];
  }

  /**
   * Generates a unique cache key for a route.
   */
  generateCacheKey(sourceCoords, destCoords, profile) {
    const sLat = Number(sourceCoords.lat).toFixed(4);
    const sLng = Number(sourceCoords.lng).toFixed(4);
    const dLat = Number(destCoords.lat).toFixed(4);
    const dLng = Number(destCoords.lng).toFixed(4);
    return `route:${profile}:${sLat},${sLng}_to_${dLat},${dLng}`;
  }

  /**
   * Primary Action: Fetch route from OpenRouteService.
   */
  async fetchFromORS(sourceCoords, destCoords, profile) {
    const apiKey = this.getOrsKey();
    if (!apiKey) {
      throw new Error('ORS_API_KEY is not configured in server environment.');
    }

    const orsProfile = this.mapProfiles(profile).ors;
    const url = `${this.orsBaseUrl}/${orsProfile}?api_key=${apiKey}&start=${sourceCoords.lng},${sourceCoords.lat}&end=${destCoords.lng},${destCoords.lat}`;

    const response = await ApiManager.fetchWithTimeout(url, {
      headers: {
        'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8'
      }
    }, 10000);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`ORS API HTTP ${response.status}: ${errText || response.statusText}`);
    }

    const data = await response.json();

    if (!data.features || data.features.length === 0) {
      throw new Error('No route features returned by OpenRouteService');
    }

    const feature = data.features[0];
    const summary = feature.properties.summary;
    const distanceKm = summary.distance / 1000;
    const durationMinutes = Math.round(summary.duration / 60);
    const coordinates = feature.geometry.coordinates; // [[lng, lat], ...]

    // Extract highway/segment names if present
    const highways = [];
    if (feature.properties.segments) {
      feature.properties.segments.forEach(segment => {
        if (segment.steps) {
          segment.steps.forEach(step => {
            if (step.name && step.name !== '-' && !highways.includes(step.name)) {
              highways.push(step.name);
            }
          });
        }
      });
    }

    const fuelEstimate = Math.round(distanceKm * 8.5); // Approx ₹8.5/km (Petrol/Diesel + Toll weighted)

    return {
      provider: 'OpenRouteService',
      profile,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationMinutes,
      coordinates,
      highways: highways.slice(0, 5),
      fuelEstimate,
      bbox: data.bbox || null
    };
  }

  /**
   * Fallback Action: Fetch route from Open Source Routing Machine (OSRM).
   */
  async fetchFromOSRM(sourceCoords, destCoords, profile) {
    const osrmProfile = this.mapProfiles(profile).osrm;
    const url = `${this.osrmBaseUrl}/${osrmProfile}/${sourceCoords.lng},${sourceCoords.lat};${destCoords.lng},${destCoords.lat}?overview=full&geometries=geojson&steps=true`;

    const response = await ApiManager.fetchWithTimeout(url, {}, 10000);

    if (!response.ok) {
      throw new Error(`OSRM API HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error('No valid routes returned by OSRM');
    }

    const route = data.routes[0];
    const distanceKm = route.distance / 1000;
    const durationMinutes = Math.round(route.duration / 60);
    const coordinates = route.geometry.coordinates; // [[lng, lat], ...]

    const highways = [];
    if (route.legs) {
      route.legs.forEach(leg => {
        if (leg.steps) {
          leg.steps.forEach(step => {
            if (step.name && step.name !== '-' && !highways.includes(step.name)) {
              highways.push(step.name);
            }
          });
        }
      });
    }

    const fuelEstimate = Math.round(distanceKm * 8.5);

    return {
      provider: 'OSRM',
      profile,
      distanceKm: parseFloat(distanceKm.toFixed(2)),
      durationMinutes,
      coordinates,
      highways: highways.slice(0, 5),
      fuelEstimate,
      bbox: null
    };
  }

  /**
   * Main unified entry point: Calculates route with primary (ORS) and automatic fallback (OSRM).
   * @param {Object} params
   * @param {{ lat: number, lng: number }} params.sourceCoords
   * @param {{ lat: number, lng: number }} params.destCoords
   * @param {'driving-car'|'foot-walking'|'cycling-regular'} [params.profile='driving-car']
   */
  async getRoute({ sourceCoords, destCoords, profile = 'driving-car' }) {
    if (!sourceCoords || !destCoords || !sourceCoords.lat || !sourceCoords.lng || !destCoords.lat || !destCoords.lng) {
      return {
        success: false,
        provider: 'None',
        error: 'Invalid coordinates: sourceCoords and destCoords with lat/lng are required.'
      };
    }

    const cacheKey = this.generateCacheKey(sourceCoords, destCoords, profile);

    return await ApiManager.executeWithFallback({
      primaryProvider: 'OpenRouteService',
      fallbackProvider: 'OSRM',
      cacheKey,
      cacheTtl: CacheService.TTL.ROUTES,
      primaryAction: () => this.fetchFromORS(sourceCoords, destCoords, profile),
      fallbackAction: () => this.fetchFromOSRM(sourceCoords, destCoords, profile)
    });
  }

  async getDrivingRoute(sourceCoords, destCoords) {
    return this.getRoute({ sourceCoords, destCoords, profile: 'driving-car' });
  }

  async getWalkingRoute(sourceCoords, destCoords) {
    return this.getRoute({ sourceCoords, destCoords, profile: 'foot-walking' });
  }

  async getCyclingRoute(sourceCoords, destCoords) {
    return this.getRoute({ sourceCoords, destCoords, profile: 'cycling-regular' });
  }
}

// Export singleton instance
module.exports = new RouteService();
