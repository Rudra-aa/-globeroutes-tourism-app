/**
 * routeRoutes.js
 * 
 * Express endpoints for Multi-Modal Routing, Corridor POIs, and Infrastructure Hubs.
 * Base path: /api/routes
 */

const express = require('express');
const router = express.Router();
const RouteService = require('../services/RouteService');
const PlacesService = require('../services/PlacesService');

// POST /api/routes/calculate
router.post('/calculate', async (req, res) => {
  const { sourceCoords, destCoords, profile = 'driving-car' } = req.body;
  const result = await RouteService.getRoute({ sourceCoords, destCoords, profile });
  res.status(result.success ? 200 : 500).json(result);
});

// POST /api/routes/road
router.post('/road', async (req, res) => {
  const { sourceCoords, destCoords, vehicleMileage = 15, fuelPrice = 100 } = req.body;
  const result = await RouteService.getDrivingRoute(sourceCoords, destCoords);

  if (result.success && result.data) {
    // Calculate fuel details if custom vehicle params provided
    if (vehicleMileage && fuelPrice && result.data.distanceKm) {
      const fuelUsed = result.data.distanceKm / vehicleMileage;
      result.data.fuelEstimate = Math.round(fuelUsed * fuelPrice);
    }
  }

  res.status(result.success ? 200 : 500).json(result);
});

// POST /api/routes/walk
router.post('/walk', async (req, res) => {
  const { sourceCoords, destCoords } = req.body;
  const result = await RouteService.getWalkingRoute(sourceCoords, destCoords);
  res.status(result.success ? 200 : 500).json(result);
});

// POST /api/routes/cycle
router.post('/cycle', async (req, res) => {
  const { sourceCoords, destCoords } = req.body;
  const result = await RouteService.getCyclingRoute(sourceCoords, destCoords);
  res.status(result.success ? 200 : 500).json(result);
});

// POST /api/routes/stations
router.post('/stations', async (req, res) => {
  const { lat, lng, radius = 50000, limit = 10 } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'lat and lng are required'
    });
  }

  const result = await PlacesService.searchRailwayStations({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });

  res.status(result.success ? 200 : 500).json(result);
});

// POST /api/routes/airports
router.post('/airports', async (req, res) => {
  const { lat, lng, radius = 100000, limit = 10 } = req.body;
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'lat and lng are required'
    });
  }

  const result = await PlacesService.searchAirports({
    lat: parseFloat(lat),
    lng: parseFloat(lng),
    radius: parseInt(radius),
    limit: parseInt(limit)
  });

  res.status(result.success ? 200 : 500).json(result);
});

// POST /api/routes/pois
router.post('/pois', async (req, res) => {
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
