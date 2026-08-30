/**
 * geocodeRoutes.js
 * 
 * Express endpoints for Geographic Lookup and Autocomplete.
 * Base path: /api/geocode
 */

const express = require('express');
const router = express.Router();
const GeocodingService = require('../services/GeocodingService');

// GET /api/geocode/search?q=Paris&limit=5
router.get('/search', async (req, res) => {
  const query = req.query.q || req.query.text;
  const limit = parseInt(req.query.limit) || 5;

  if (!query) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'Query parameter q is required'
    });
  }

  const result = await GeocodingService.autocomplete(query, limit);
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/geocode/autocomplete?q=Del&limit=5
router.get('/autocomplete', async (req, res) => {
  const query = req.query.q || req.query.text;
  const limit = parseInt(req.query.limit) || 5;

  if (!query) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'Query parameter q is required'
    });
  }

  const result = await GeocodingService.autocomplete(query, limit);
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/geocode/reverse?lat=28.6139&lng=77.2090
router.get('/reverse', async (req, res) => {
  const lat = parseFloat(req.query.lat);
  const lng = parseFloat(req.query.lng);

  if (isNaN(lat) || isNaN(lng)) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'Valid numeric lat and lng query parameters are required'
    });
  }

  const result = await GeocodingService.coordinatesToCity(lat, lng);
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/geocode/city?q=Goa
router.get('/city', async (req, res) => {
  const cityName = req.query.q || req.query.city;
  if (!cityName) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'City name query parameter q is required'
    });
  }

  const result = await GeocodingService.cityToCoordinates(cityName);
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/geocode/country?q=India
router.get('/country', async (req, res) => {
  const country = req.query.q || req.query.country;
  if (!country) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'Country query parameter q is required'
    });
  }

  const result = await GeocodingService.countryLookup(country);
  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
