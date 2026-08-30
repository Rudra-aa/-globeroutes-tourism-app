/**
 * flightRoutes.js
 * 
 * Express endpoints for Aviation Intelligence & Live Flight Offers via Amadeus API.
 * Base path: /api/flights
 */

const express = require('express');
const router = express.Router();
const FlightService = require('../services/FlightService');

// GET /api/flights/search?originCode=DEL&destinationCode=BOM&departureDate=2026-09-15&adults=1
router.get('/search', async (req, res) => {
  const { originCode, destinationCode, departureDate, returnDate, adults, travelClass, maxResults } = req.query;

  if (!originCode || !destinationCode || !departureDate) {
    return res.status(400).json({
      success: false,
      provider: 'Amadeus',
      error: 'originCode, destinationCode, and departureDate (YYYY-MM-DD) query parameters are required'
    });
  }

  const result = await FlightService.searchFlights({
    originCode,
    destinationCode,
    departureDate,
    returnDate,
    adults: parseInt(adults) || 1,
    travelClass: travelClass || 'ECONOMY',
    maxResults: parseInt(maxResults) || 10
  });

  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/flights/airports?keyword=Delhi or ?lat=28.6139&lng=77.2090
router.get('/airports', async (req, res) => {
  const { keyword, lat, lng, limit = 10 } = req.query;

  if (!keyword && (!lat || !lng)) {
    return res.status(400).json({
      success: false,
      provider: 'Amadeus',
      error: 'keyword or lat/lng query parameters are required'
    });
  }

  const result = await FlightService.searchAirports({
    keyword,
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
    limit: parseInt(limit)
  });

  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/flights/lookup?iataCode=DEL
router.get('/lookup', async (req, res) => {
  const { iataCode } = req.query;
  if (!iataCode) {
    return res.status(400).json({
      success: false,
      provider: 'Amadeus',
      error: 'iataCode query parameter is required'
    });
  }

  const result = await FlightService.airportLookup({ iataCode });
  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
