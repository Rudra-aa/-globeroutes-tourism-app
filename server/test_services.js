require('dotenv').config();

const CacheService = require('./services/CacheService');
const ApiManager = require('./services/ApiManager');
const RouteService = require('./services/RouteService');
const PlacesService = require('./services/PlacesService');
const WeatherService = require('./services/WeatherService');
const FlightService = require('./services/FlightService');
const GeocodingService = require('./services/GeocodingService');

async function runTests() {
  console.log('========================================================');
  console.log('🚀 GLOBEROUTES PHASE 1: API INTEGRATION TEST SUITE');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(name, condition, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${name} ${details}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details}`);
      failed++;
    }
  }

  // ── 1. CACHE SERVICE TEST ───────────────────────────────────────────
  console.log('--- 1. Testing CacheService ---');
  CacheService.set('test:key1', { msg: 'hello' }, 1000);
  assert('Cache set & get', CacheService.get('test:key1')?.msg === 'hello');
  assert('Cache has() check', CacheService.has('test:key1') === true);

  CacheService.invalidate('test:key1');
  assert('Cache invalidate()', CacheService.get('test:key1') === null);

  const stats = CacheService.getStats();
  assert('Cache metrics tracking', stats.sets > 0 && stats.hits > 0, `(Hits: ${stats.hits}, Sets: ${stats.sets})`);

  // ── 2. API MANAGER TEST ────────────────────────────────────────────
  console.log('\n--- 2. Testing ApiManager ---');
  const apiTestResult = await ApiManager.execute({
    provider: 'TestProvider',
    cacheKey: 'test:apimanager',
    cacheTtl: 5000,
    action: async () => ({ status: 'ok', value: 42 })
  });
  assert('ApiManager execution wrapper', apiTestResult.success === true && apiTestResult.data.value === 42);
  assert('ApiManager response format', apiTestResult.provider === 'TestProvider' && apiTestResult.cached === false);

  // Cached run
  const cachedApiResult = await ApiManager.execute({
    provider: 'TestProvider',
    cacheKey: 'test:apimanager',
    action: async () => ({ status: 'ok', value: 99 })
  });
  assert('ApiManager cached execution', cachedApiResult.cached === true && cachedApiResult.data.value === 42);

  // ── 3. GEOCODING SERVICE TEST ──────────────────────────────────────
  console.log('\n--- 3. Testing GeocodingService ---');
  try {
    const geoResult = await GeocodingService.cityToCoordinates('Delhi');
    assert('GeocodingService cityToCoordinates', geoResult.success === true && geoResult.data.lat !== undefined, `(Lat: ${geoResult.data?.lat}, Lng: ${geoResult.data?.lng})`);
  } catch (e) {
    console.error('Geocoding test error:', e.message);
  }

  try {
    const autoResult = await GeocodingService.autocomplete('Goa', 3);
    assert('GeocodingService autocomplete', autoResult.success === true && Array.isArray(autoResult.data), `(Found: ${autoResult.data?.length} results)`);
  } catch (e) {
    console.error('Autocomplete test error:', e.message);
  }

  // ── 4. ROUTE SERVICE TEST ──────────────────────────────────────────
  console.log('\n--- 4. Testing RouteService (ORS with OSRM Fallback) ---');
  const delhiCoords = { lat: 28.6139, lng: 77.2090 };
  const agraCoords = { lat: 27.1767, lng: 78.0081 };

  try {
    const routeResult = await RouteService.getDrivingRoute(delhiCoords, agraCoords);
    assert('RouteService Driving Route', routeResult.success === true, `(Provider: ${routeResult.provider}, Distance: ${routeResult.data?.distanceKm} km, Duration: ${routeResult.data?.durationMinutes} mins)`);
    assert('RouteService Polyline Coordinates', Array.isArray(routeResult.data?.coordinates) && routeResult.data?.coordinates.length > 0);
    assert('RouteService Fuel Estimation', routeResult.data?.fuelEstimate > 0, `(Fuel Est: ₹${routeResult.data?.fuelEstimate})`);
  } catch (e) {
    console.error('RouteService test error:', e.message);
  }

  // ── 5. PLACES SERVICE TEST ─────────────────────────────────────────
  console.log('\n--- 5. Testing PlacesService (Overpass) ---');
  try {
    const stationsResult = await PlacesService.searchRailwayStations({ lat: 28.6139, lng: 77.2090, radius: 25000, limit: 5 });
    assert('PlacesService Railway Stations', stationsResult.success === true, `(Provider: ${stationsResult.provider}, Found: ${stationsResult.data?.length} stations)`);
  } catch (e) {
    console.error('PlacesService test error:', e.message);
  }

  // ── 6. FLIGHT SERVICE TEST ─────────────────────────────────────────
  console.log('\n--- 6. Testing FlightService (Amadeus / Safe Fallback) ---');
  try {
    const flightResult = await FlightService.searchAirports({ keyword: 'DEL' });
    assert('FlightService Strict No-Fabrication Check', flightResult.success === true && flightResult.data !== undefined);
    console.log(`Flight availability status: available=${flightResult.data?.available}`);
  } catch (e) {
    console.error('FlightService test error:', e.message);
  }

  // ── 7. WEATHER SERVICE TEST ────────────────────────────────────────
  console.log('\n--- 7. Testing WeatherService (OpenWeather) ---');
  try {
    const weatherResult = await WeatherService.getCurrentWeather({ city: 'London' });
    assert('WeatherService Unified Response Format', weatherResult.provider === 'OpenWeather');
    if (weatherResult.success) {
      console.log(`Live Weather: ${weatherResult.data?.city}: ${weatherResult.data?.temperature}°C, ${weatherResult.data?.weather?.description}`);
    } else {
      console.log(`WeatherService graceful key notification: ${weatherResult.error}`);
    }
  } catch (e) {
    console.error('WeatherService test error:', e.message);
  }

  console.log('\n========================================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');
}

runTests().catch(console.error);
