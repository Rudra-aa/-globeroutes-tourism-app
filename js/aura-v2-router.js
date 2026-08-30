/**
 * Aura V2 Route Intelligence Engine
 * STRICT DATA POLICY: Never fabricate routes, distances, durations, or prices.
 */
class AuraRouter {
  constructor() {
    this.apiBase = '/api/routes';
  }

  async getCityCoordinates(cityName) {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cityName)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          name: this.capitalizeCity(cityName)
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding failed for', cityName, err);
      return null;
    }
  }

  async compareRoutes(source, destination) {
    try {
      const srcCoords = await this.getCityCoordinates(source);
      const dstCoords = await this.getCityCoordinates(destination);

      if (!srcCoords || !dstCoords) {
        throw new Error('Unable to geocode source or destination.');
      }

      let routes = [];

      // Fetch unified verified route data
      const roadData = await window.RouteIntelligence.getRoadRoute(srcCoords, dstCoords);
      if (roadData) {
        routes.push({
          type: 'road',
          source: srcCoords.name,
          destination: dstCoords.name,
          distance: roadData.distanceKm,
          duration: roadData.durationMinutes / 60, // hours for ranking
          costMin: roadData.fuelEstimate, 
          costMax: roadData.fuelEstimate * 1.2,
          geometry: null, // Don't pass full polyline to chat to save memory
          isVerified: true,
          confidence: roadData.confidence,
          warnings: roadData.routeWarnings
        });
      }

      // Add strict unavailable notices for Train and Flight
      routes.push({
        type: 'train',
        isVerified: false,
        unavailable: true,
        message: 'Verified train schedules and fares are currently unavailable.'
      });

      routes.push({
        type: 'flight',
        isVerified: false,
        unavailable: true,
        message: 'Verified flight schedules and prices are currently unavailable.'
      });

      if (routes.filter(r => !r.unavailable).length === 0) {
        throw new Error('Live route information is unavailable right now.');
      }

      const ranked = this.rankRoutes(source, destination, routes);
      
      return ranked;
    } catch (err) {
      console.error('Route Engine Error:', err);
      throw err;
    }
  }

  rankRoutes(source, destination, routes) {
    const validRoutes = routes.filter(r => !r.unavailable);
    const ranked = validRoutes.map((route, idx) => ({
      ...route,
      rank: idx + 1,
      cheapest: route.type === 'train',
      fastest: route.type === 'flight',
      mostComfortable: route.type === 'road',
      isVerified: route.isVerified !== undefined ? route.isVerified : true
    })).sort((a, b) => a.duration - b.duration);

    // Merge unavailable back for display
    const allRoutes = [...ranked, ...routes.filter(r => r.unavailable)];

    return {
      source: this.capitalizeCity(source),
      destination: this.capitalizeCity(destination),
      totalOptions: allRoutes.length,
      routes: allRoutes,
      cheapest: ranked.find(r => r.type === 'train') || ranked[0] || null,
      fastest: ranked.find(r => r.type === 'flight') || ranked[0] || null,
      recommended: ranked[0] || null
    };
  }

  capitalizeCity(city) {
    if (!city) return '';
    return city.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
  }
}

window.AuraRouter = AuraRouter;
