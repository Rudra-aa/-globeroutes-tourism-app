/**
 * placesRoutes.js
 * 
 * Express endpoints for POI Discovery, Infrastructure, Amenities, and Route Corridors.
 * Base path: /api/places
 */

const express = require('express');
const router = express.Router();
const PlacesService = require('../services/PlacesService');

// GET /api/places/nearby?lat=28.6139&lng=77.2090&categories=fuel,hotel&radius=5000&limit=20
router.get('/nearby', async (req, res) => {
  const { lat, lng, radius = 5000, categories, limit = 30 } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'lat and lng parameters are required'
    });
  }

  const categoryList = categories ? categories.split(',').map(c => c.trim().toLowerCase()) : ['attraction'];
  const result = await PlacesService.searchNearby({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    categories: categoryList,
    limit: parseInt(limit)
  });

  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/places/fuel?lat=...&lng=...
router.get('/fuel', async (req, res) => {
  const { lat, lng, radius = 10000, limit = 20 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng required' });

  const result = await PlacesService.searchFuelStations({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/places/hotels?lat=...&lng=...
router.get('/hotels', async (req, res) => {
  const { lat, lng, radius = 15000, limit = 20 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng required' });

  const result = await PlacesService.searchHotels({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/places/hospitals?lat=...&lng=...
router.get('/hospitals', async (req, res) => {
  const { lat, lng, radius = 15000, limit = 20 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng required' });

  const result = await PlacesService.searchHospitals({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/places/restaurants?lat=...&lng=...
router.get('/restaurants', async (req, res) => {
  const { lat, lng, radius = 10000, limit = 25 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng required' });

  const result = await PlacesService.searchRestaurants({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/places/stations?lat=...&lng=...
router.get('/stations', async (req, res) => {
  const { lat, lng, radius = 50000, limit = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng required' });

  const result = await PlacesService.searchRailwayStations({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/places/airports?lat=...&lng=...
router.get('/airports', async (req, res) => {
  const { lat, lng, radius = 100000, limit = 10 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng required' });

  const result = await PlacesService.searchAirports({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/places/ev?lat=...&lng=...
router.get('/ev', async (req, res) => {
  const { lat, lng, radius = 25000, limit = 20 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng required' });

  const result = await PlacesService.searchEVChargers({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });
  res.status(result.success ? 200 : 500).json(result);
});

// GET /api/places/attractions?lat=...&lng=...
router.get('/attractions', async (req, res) => {
  const { lat, lng, radius = 25000, limit = 30 } = req.query;
  if (!lat || !lng) return res.status(400).json({ success: false, error: 'lat and lng required' });

  const result = await PlacesService.searchTouristAttractions({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });
  res.status(result.success ? 200 : 500).json(result);
});

// POST /api/places/along-route
router.post('/along-route', async (req, res) => {
  const { coordinates, categories, sampleCount } = req.body;
  if (!coordinates || !Array.isArray(coordinates) || coordinates.length < 2) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'coordinates array with at least 2 points is required'
    });
  }

  const result = await PlacesService.searchAlongRoute({
    coordinates,
    categories: categories || ['fuel', 'hotel', 'hospital', 'ev_charger'],
    sampleCount: sampleCount || 8
  });

  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
