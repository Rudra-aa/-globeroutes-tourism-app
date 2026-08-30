/**
 * weatherRoutes.js
 * 
 * Express endpoints for Live Weather, 5-Day Forecasts, and Severe Travel Weather Alerts.
 * Base path: /api/weather
 */

const express = require('express');
const router = express.Router();
const WeatherService = require('../services/WeatherService');

// GET /api/weather/current?city=Goa or ?lat=15.2993&lng=74.1240
router.get('/current', async (req, res) => {
  const { city, lat, lng, units = 'metric' } = req.query;
  const result = await WeatherService.getCurrentWeather({
    city,
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
    units
  });

  res.status(result.success ? 200 : (result.error?.includes('not configured') ? 200 : 500)).json(result);
});

// GET /api/weather/forecast?city=Goa or ?lat=15.2993&lng=74.1240
router.get('/forecast', async (req, res) => {
  const { city, lat, lng, units = 'metric' } = req.query;
  const result = await WeatherService.getForecast({
    city,
    lat: lat ? parseFloat(lat) : null,
    lng: lng ? parseFloat(lng) : null,
    units
  });

  res.status(result.success ? 200 : (result.error?.includes('not configured') ? 200 : 500)).json(result);
});

// GET /api/weather/alerts?lat=15.2993&lng=74.1240
router.get('/alerts', async (req, res) => {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({
      success: false,
      provider: 'None',
      error: 'lat and lng parameters are required for weather alerts'
    });
  }

  const result = await WeatherService.getWeatherAlerts({
    lat: parseFloat(lat),
    lng: parseFloat(lng)
  });

  res.status(result.success ? 200 : 500).json(result);
});

module.exports = router;
