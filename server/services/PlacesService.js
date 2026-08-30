/**
 * PlacesService.js
 * 
 * POI & Infrastructure Intelligence Service powered by OpenStreetMap / Overpass API.
 * 
 * Capabilities:
 *  - searchFuelStations()
 *  - searchHotels()
 *  - searchHospitals()
 *  - searchRestaurants()
 *  - searchRailwayStations()
 *  - searchAirports()
 *  - searchEVChargers()
 *  - searchToilets()
 *  - searchTouristAttractions()
 *  - searchNearby()
 *  - searchAlongRoute()
 */

const ApiManager = require('./ApiManager');
const CacheService = require('./CacheService');

class PlacesService {
  constructor() {
    this.overpassEndpoints = [
      'https://overpass-api.de/api/interpreter',
      'https://lz4.overpass-api.de/api/interpreter',
      'https://overpass.kumi.systems/api/interpreter'
    ];
    this.currentEndpointIndex = 0;
  }

  getEndpoint() {
    return this.overpassEndpoints[this.currentEndpointIndex % this.overpassEndpoints.length];
  }

  rotateEndpoint() {
    this.currentEndpointIndex++;
  }

  /**
   * Helper: Calculates Great Circle distance between two points in kilometers.
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(2));
  }

  /**
   * Map category to Overpass QL filter fragments.
   */
  getCategoryFilters(category) {
    const map = {
      'fuel': ['node["amenity"="fuel"]', 'way["amenity"="fuel"]'],
      'hotel': ['node["tourism"="hotel"]', 'node["tourism"="guest_house"]', 'node["tourism"="motel"]', 'node["tourism"="hostel"]', 'way["tourism"="hotel"]'],
      'hospital': ['node["amenity"="hospital"]', 'node["amenity"="clinic"]', 'way["amenity"="hospital"]'],
      'restaurant': ['node["amenity"="restaurant"]', 'node["amenity"="cafe"]', 'node["amenity"="fast_food"]'],
      'station': ['node["railway"="station"]', 'node["public_transport"="station"]["railway"]', 'way["railway"="station"]'],
      'airport': ['node["aeroway"="aerodrome"]', 'way["aeroway"="aerodrome"]', 'node["aeroway"="terminal"]'],
      'ev_charger': ['node["amenity"="charging_station"]'],
      'toilets': ['node["amenity"="toilets"]'],
      'attraction': ['node["tourism"="attraction"]', 'node["historic"]', 'node["tourism"="viewpoint"]', 'node["tourism"="museum"]', 'way["tourism"="attraction"]']
    };
    return map[category] || map['attraction'];
  }

  /**
   * Executes an Overpass QL query and returns parsed elements.
   */
  async queryOverpass(qlQuery) {
    const endpoint = this.getEndpoint();

    const response = await ApiManager.fetchWithTimeout(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        'Accept': 'application/json',
        'User-Agent': 'GlobeRoutes-Tourism-App/1.0 (info@globeroutes.co)'
      },
      body: `data=${encodeURIComponent(qlQuery)}`
    }, 15000);

    if (!response.ok) {
      this.rotateEndpoint();
      const errText = await response.text().catch(() => '');
      throw new Error(`Overpass API HTTP ${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = await response.json();
    return data.elements || [];
  }

  /**
   * Normalize an Overpass element into a clean POI object.
   */
  normalizeElement(el, originLat, originLng, categoryFallback = 'place') {
    const lat = el.lat || (el.center ? el.center.lat : null);
    const lng = el.lon || (el.center ? el.center.lon : null);

    if (!lat || !lng) return null;

    const tags = el.tags || {};
    const name = tags.name || tags['name:en'] || tags.brand || tags.operator || `${this.capitalize(categoryFallback)} Point`;
    const distanceKm = originLat && originLng ? this.calculateDistance(originLat, originLng, lat, lng) : null;

    return {
      id: el.id,
      name,
      category: categoryFallback,
      type: tags.amenity || tags.tourism || tags.railway || tags.aeroway || tags.historic || categoryFallback,
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      tags: {
        brand: tags.brand || null,
        operator: tags.operator || null,
        cuisine: tags.cuisine || null,
        stars: tags.stars || null,
        phone: tags.phone || tags['contact:phone'] || null,
        website: tags.website || tags['contact:website'] || null,
        iata: tags.iata || null,
        opening_hours: tags.opening_hours || null
      },
      distanceFromOriginKm: distanceKm
    };
  }

  capitalize(s) {
    return s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ') : '';
  }

  /**
   * Generic Nearby Search around a coordinate.
   * @param {Object} params
   * @param {number} params.lat
   * @param {number} params.lng
   * @param {number} [params.radius=5000] - Radius in meters
   * @param {string[]} [params.categories=['attraction']] - Categories to search
   * @param {number} [params.limit=30]
   */
  async searchNearby({ lat, lng, radius = 5000, categories = ['attraction'], limit = 30 }) {
    if (!lat || !lng) {
      return {
        success: false,
        provider: 'Overpass',
        error: 'lat and lng parameters are required.'
      };
    }

    const cacheKey = `places:nearby:${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}:r${radius}:c${categories.sort().join('_')}:l${limit}`;

    return await ApiManager.execute({
      provider: 'Overpass',
      cacheKey,
      cacheTtl: CacheService.TTL.POIS,
      action: async () => {
        let filters = [];
        categories.forEach(cat => {
          const catFilters = this.getCategoryFilters(cat);
          catFilters.forEach(f => {
            filters.push(`${f}(around:${radius},${lat},${lng});`);
          });
        });

        const ql = `
          [out:json][timeout:15];
          (
            ${filters.join('\n')}
          );
          out center ${limit};
        `;

        const elements = await this.queryOverpass(ql);
        const places = elements
          .map(el => {
            let matchedCat = categories[0];
            for (const cat of categories) {
              const tags = el.tags || {};
              if (cat === 'fuel' && tags.amenity === 'fuel') matchedCat = 'fuel';
              else if (cat === 'hotel' && tags.tourism === 'hotel') matchedCat = 'hotel';
              else if (cat === 'hospital' && tags.amenity === 'hospital') matchedCat = 'hospital';
              else if (cat === 'restaurant' && ['restaurant', 'cafe', 'fast_food'].includes(tags.amenity)) matchedCat = 'restaurant';
              else if (cat === 'station' && tags.railway === 'station') matchedCat = 'station';
              else if (cat === 'airport' && tags.aeroway) matchedCat = 'airport';
              else if (cat === 'ev_charger' && tags.amenity === 'charging_station') matchedCat = 'ev_charger';
            }
            return this.normalizeElement(el, lat, lng, matchedCat);
          })
          .filter(p => p !== null && p.name);

        // Sort by proximity
        places.sort((a, b) => (a.distanceFromOriginKm || 0) - (b.distanceFromOriginKm || 0));

        return places.slice(0, limit);
      }
    });
  }

  async searchFuelStations({ lat, lng, radius = 10000, limit = 20 }) {
    return this.searchNearby({ lat, lng, radius, categories: ['fuel'], limit });
  }

  async searchHotels({ lat, lng, radius = 15000, limit = 20 }) {
    return this.searchNearby({ lat, lng, radius, categories: ['hotel'], limit });
  }

  async searchHospitals({ lat, lng, radius = 15000, limit = 20 }) {
    return this.searchNearby({ lat, lng, radius, categories: ['hospital'], limit });
  }

  async searchRestaurants({ lat, lng, radius = 10000, limit = 25 }) {
    return this.searchNearby({ lat, lng, radius, categories: ['restaurant'], limit });
  }

  async searchRailwayStations({ lat, lng, radius = 50000, limit = 10 }) {
    const cacheKey = `places:stations:${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
    return await ApiManager.execute({
      provider: 'Overpass',
      cacheKey,
      cacheTtl: CacheService.TTL.STATIONS,
      action: async () => {
        const result = await this.searchNearby({ lat, lng, radius, categories: ['station'], limit });
        return result.data || [];
      }
    });
  }

  async searchAirports({ lat, lng, radius = 100000, limit = 10 }) {
    const cacheKey = `places:airports:${Number(lat).toFixed(3)},${Number(lng).toFixed(3)}`;
    return await ApiManager.execute({
      provider: 'Overpass',
      cacheKey,
      cacheTtl: CacheService.TTL.AIRPORTS,
      action: async () => {
        const result = await this.searchNearby({ lat, lng, radius, categories: ['airport'], limit });
        return result.data || [];
      }
    });
  }

  async searchEVChargers({ lat, lng, radius = 25000, limit = 20 }) {
    return this.searchNearby({ lat, lng, radius, categories: ['ev_charger'], limit });
  }

  async searchToilets({ lat, lng, radius = 10000, limit = 15 }) {
    return this.searchNearby({ lat, lng, radius, categories: ['toilets'], limit });
  }

  async searchTouristAttractions({ lat, lng, radius = 25000, limit = 30 }) {
    return this.searchNearby({ lat, lng, radius, categories: ['attraction'], limit });
  }

  /**
   * Search for POIs along a corridor (route polyline).
   * @param {Object} params
   * @param {number[][]} params.coordinates - Array of [lng, lat] GeoJSON coordinates
   * @param {string[]} [params.categories=['fuel', 'hotel', 'hospital', 'ev_charger']]
   * @param {number} [params.sampleCount=8] - Number of sampled points along the route
   */
  async searchAlongRoute({ coordinates, categories = ['fuel', 'hotel', 'hospital', 'ev_charger'], sampleCount = 8 }) {
    if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
      return {
        success: false,
        provider: 'Overpass',
        error: 'coordinates array is required'
      };
    }

    // Sample points evenly along polyline to avoid hitting Overpass with hundreds of queries
    const step = Math.max(1, Math.floor(coordinates.length / sampleCount));
    const samplePoints = [];
    for (let i = 0; i < coordinates.length; i += step) {
      samplePoints.push({ lng: coordinates[i][0], lat: coordinates[i][1] });
    }
    if (samplePoints.length > 0 && samplePoints[samplePoints.length - 1].lat !== coordinates[coordinates.length - 1][1]) {
      samplePoints.push({ lng: coordinates[coordinates.length - 1][0], lat: coordinates[coordinates.length - 1][1] });
    }

    const cacheKey = `places:corridor:${coordinates.length}:${samplePoints.map(p => `${p.lat.toFixed(2)},${p.lng.toFixed(2)}`).join('|')}:${categories.join('_')}`;

    return await ApiManager.execute({
      provider: 'Overpass',
      cacheKey,
      cacheTtl: CacheService.TTL.POIS,
      action: async () => {
        let filters = [];
        samplePoints.forEach(pt => {
          categories.forEach(cat => {
            const catFilters = this.getCategoryFilters(cat);
            catFilters.forEach(f => {
              filters.push(`${f}(around:8000,${pt.lat},${pt.lng});`);
            });
          });
        });

        const ql = `
          [out:json][timeout:20];
          (
            ${filters.join('\n')}
          );
          out center 40;
        `;

        const elements = await this.queryOverpass(ql);
        const seenIds = new Set();
        const pois = [];

        elements.forEach(el => {
          if (!seenIds.has(el.id)) {
            seenIds.add(el.id);
            const normalized = this.normalizeElement(el, samplePoints[0].lat, samplePoints[0].lng, 'rest_stop');
            if (normalized && normalized.name) {
              pois.push(normalized);
            }
          }
        });

        return pois.slice(0, 40);
      }
    });
  }
}

// Export singleton instance
module.exports = new PlacesService();
