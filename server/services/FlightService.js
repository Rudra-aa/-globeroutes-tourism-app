/**
 * FlightService.js
 * 
 * Aviation & Flight Intelligence Service powered by Amadeus Self-Service APIs.
 * 
 * Capabilities:
 *  - searchAirports({ keyword, lat, lng })
 *  - searchFlights({ originCode, destinationCode, departureDate, returnDate, adults, travelClass })
 *  - airportLookup({ iataCode })
 * 
 * STRICT POLICY:
 *  - If credentials are not configured, returns { available: false }
 *  - NEVER fabricate flight schedules, prices, or airline data.
 */

const ApiManager = require('./ApiManager');
const CacheService = require('./CacheService');

class FlightService {
  constructor() {
    this.hostname = process.env.AMADEUS_HOSTNAME === 'production' 
      ? 'https://api.amadeus.com' 
      : 'https://test.api.amadeus.com';
    this.token = null;
    this.tokenExpiresAt = 0;
  }

  hasCredentials() {
    return !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  }

  /**
   * Generates or retrieves cached OAuth2 bearer token from Amadeus.
   */
  async getAccessToken() {
    if (!this.hasCredentials()) {
      return null;
    }

    // Return cached token if valid with 60s buffer
    if (this.token && Date.now() < this.tokenExpiresAt - 60000) {
      return this.token;
    }

    const tokenUrl = `${this.hostname}/v1/security/oauth2/token`;
    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.AMADEUS_CLIENT_ID,
      client_secret: process.env.AMADEUS_CLIENT_SECRET
    });

    const response = await ApiManager.fetchWithTimeout(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    }, 8000);

    if (!response.ok) {
      const errText = await response.text().catch(() => '');
      throw new Error(`Amadeus Auth Failed HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    this.token = data.access_token;
    this.tokenExpiresAt = Date.now() + (data.expires_in * 1000);

    return this.token;
  }

  /**
   * Search for airports by city keyword or geographic coordinates.
   */
  async searchAirports({ keyword, lat, lng, limit = 10 }) {
    if (!this.hasCredentials()) {
      return {
        success: true,
        provider: 'Amadeus',
        cached: false,
        data: { available: false, message: 'Amadeus API credentials not configured.' }
      };
    }

    let queryParam = '';
    let cacheKey = '';

    if (keyword) {
      queryParam = `subType=AIRPORT,CITY&keyword=${encodeURIComponent(keyword)}&page[limit]=${limit}`;
      cacheKey = `flights:airports:keyword:${keyword.toLowerCase().trim()}`;
    } else if (lat && lng) {
      queryParam = `latitude=${lat}&longitude=${lng}&radius=300&subType=AIRPORT&page[limit]=${limit}`;
      cacheKey = `flights:airports:geo:${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}`;
    } else {
      return {
        success: false,
        provider: 'Amadeus',
        error: 'keyword or lat/lng parameter is required for airport search.'
      };
    }

    const url = `${this.hostname}/v1/reference-data/locations?${queryParam}`;

    return await ApiManager.execute({
      provider: 'Amadeus',
      cacheKey,
      cacheTtl: CacheService.TTL.AIRPORTS,
      action: async () => {
        const token = await this.getAccessToken();
        const response = await ApiManager.fetchWithTimeout(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        }, 8000);

        if (!response.ok) {
          throw new Error(`Amadeus Airport Search HTTP ${response.status}`);
        }

        const json = await response.json();
        const airports = (json.data || []).map(item => ({
          iataCode: item.iataCode,
          name: item.name,
          cityName: item.address?.cityName,
          countryName: item.address?.countryName,
          countryCode: item.address?.countryCode,
          lat: item.geoCode?.latitude,
          lng: item.geoCode?.longitude,
          distanceFromCityKm: item.distance?.value || null
        }));

        return {
          available: true,
          count: airports.length,
          airports
        };
      }
    });
  }

  /**
   * Search live flight offers between two airport IATA codes.
   */
  async searchFlights({
    originCode,
    destinationCode,
    departureDate,
    returnDate = null,
    adults = 1,
    travelClass = 'ECONOMY',
    maxResults = 10
  }) {
    if (!this.hasCredentials()) {
      return {
        success: true,
        provider: 'Amadeus',
        cached: false,
        data: { available: false, message: 'Amadeus API credentials not configured.' }
      };
    }

    if (!originCode || !destinationCode || !departureDate) {
      return {
        success: false,
        provider: 'Amadeus',
        error: 'originCode, destinationCode, and departureDate (YYYY-MM-DD) are required.'
      };
    }

    const oCode = originCode.toUpperCase().trim();
    const dCode = destinationCode.toUpperCase().trim();
    const cacheKey = `flights:search:${oCode}_to_${dCode}:${departureDate}:${returnDate || 'oneway'}:${adults}:${travelClass}`;

    let url = `${this.hostname}/v2/shopping/flight-offers?originLocationCode=${oCode}&destinationLocationCode=${dCode}&departureDate=${departureDate}&adults=${adults}&travelClass=${travelClass}&max=${maxResults}&currencyCode=INR`;
    if (returnDate) {
      url += `&returnDate=${returnDate}`;
    }

    return await ApiManager.execute({
      provider: 'Amadeus',
      cacheKey,
      cacheTtl: CacheService.TTL.FLIGHTS,
      action: async () => {
        const token = await this.getAccessToken();
        const response = await ApiManager.fetchWithTimeout(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        }, 10000);

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.errors?.[0]?.detail || `Amadeus Flight Search HTTP ${response.status}`);
        }

        const json = await response.json();
        const offers = (json.data || []).map(offer => {
          const itinerary = offer.itineraries?.[0];
          const firstSegment = itinerary?.segments?.[0];
          const lastSegment = itinerary?.segments?.[itinerary.segments.length - 1];

          return {
            id: offer.id,
            totalPrice: parseFloat(offer.price?.total),
            currency: offer.price?.currency || 'INR',
            numberOfBookableSeats: offer.numberOfBookableSeats,
            duration: itinerary?.duration, // e.g. PT2H15M
            stops: Math.max(0, (itinerary?.segments?.length || 1) - 1),
            airline: firstSegment?.carrierCode,
            flightNumber: `${firstSegment?.carrierCode} ${firstSegment?.number}`,
            departureTime: firstSegment?.departure?.at,
            arrivalTime: lastSegment?.arrival?.at,
            originAirport: firstSegment?.departure?.iataCode,
            destinationAirport: lastSegment?.arrival?.iataCode
          };
        });

        return {
          available: true,
          origin: oCode,
          destination: dCode,
          departureDate,
          returnDate,
          totalOffers: offers.length,
          cheapestPrice: offers.length > 0 ? Math.min(...offers.map(o => o.totalPrice)) : null,
          offers
        };
      }
    });
  }

  /**
   * Airport Lookup by specific IATA Code.
   */
  async airportLookup({ iataCode }) {
    if (!iataCode) {
      return {
        success: false,
        provider: 'Amadeus',
        error: 'iataCode is required'
      };
    }

    return this.searchAirports({ keyword: iataCode, limit: 1 });
  }
}

// Export singleton instance
module.exports = new FlightService();
