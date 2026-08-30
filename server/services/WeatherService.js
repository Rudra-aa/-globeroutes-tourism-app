/**
 * WeatherService.js
 * 
 * Live Meteorological & Forecast Intelligence Service powered by OpenWeather API.
 * 
 * Capabilities:
 *  - getCurrentWeather({ lat, lng, city, units })
 *  - getForecast({ lat, lng, city, units })
 *  - getWeatherAlerts({ lat, lng })
 */

const ApiManager = require('./ApiManager');
const CacheService = require('./CacheService');

class WeatherService {
  constructor() {
    this.apiBase = 'https://api.openweathermap.org/data/2.5';
  }

  getApiKey() {
    return process.env.OPENWEATHER_API_KEY || null;
  }

  /**
   * Format OpenWeather icon code to full HTTPS asset URL.
   */
  getIconUrl(iconCode) {
    return iconCode ? `https://openweathermap.org/img/wn/${iconCode}@2x.png` : null;
  }

  /**
   * Fetch current live weather for a coordinate or city name.
   */
  async getCurrentWeather({ lat, lng, city, units = 'metric' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        provider: 'OpenWeather',
        error: 'OPENWEATHER_API_KEY is not configured in server environment.'
      };
    }

    let queryParam = '';
    let cacheKey = '';

    if (lat && lng) {
      queryParam = `lat=${lat}&lon=${lng}`;
      cacheKey = `weather:current:coord:${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}:${units}`;
    } else if (city) {
      queryParam = `q=${encodeURIComponent(city)}`;
      cacheKey = `weather:current:city:${city.toLowerCase().trim()}:${units}`;
    } else {
      return {
        success: false,
        provider: 'OpenWeather',
        error: 'lat/lng or city parameter is required.'
      };
    }

    const url = `${this.apiBase}/weather?${queryParam}&units=${units}&appid=${apiKey}`;

    return await ApiManager.execute({
      provider: 'OpenWeather',
      cacheKey,
      cacheTtl: CacheService.TTL.WEATHER,
      action: async () => {
        const response = await ApiManager.fetchWithTimeout(url, {}, 8000);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `OpenWeather HTTP ${response.status}`);
        }

        const data = await response.json();

        return {
          city: data.name,
          country: data.sys?.country || null,
          coordinates: { lat: data.coord.lat, lng: data.coord.lon },
          temperature: Math.round(data.main.temp),
          feels_like: Math.round(data.main.feels_like),
          temp_min: Math.round(data.main.temp_min),
          temp_max: Math.round(data.main.temp_max),
          humidity: data.main.humidity,
          pressure: data.main.pressure,
          windSpeed: data.wind?.speed,
          visibilityKm: data.visibility ? data.visibility / 1000 : null,
          weather: {
            main: data.weather[0]?.main || 'Clear',
            description: data.weather[0]?.description || '',
            icon: data.weather[0]?.icon || null,
            iconUrl: this.getIconUrl(data.weather[0]?.icon)
          },
          sunrise: data.sys?.sunrise ? new Date(data.sys.sunrise * 1000).toLocaleTimeString() : null,
          sunset: data.sys?.sunset ? new Date(data.sys.sunset * 1000).toLocaleTimeString() : null,
          units: units === 'metric' ? '°C' : '°F'
        };
      }
    });
  }

  /**
   * Fetch 5-day / 3-hour weather forecast aggregated into daily summaries.
   */
  async getForecast({ lat, lng, city, units = 'metric' }) {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return {
        success: false,
        provider: 'OpenWeather',
        error: 'OPENWEATHER_API_KEY is not configured in server environment.'
      };
    }

    let queryParam = '';
    let cacheKey = '';

    if (lat && lng) {
      queryParam = `lat=${lat}&lon=${lng}`;
      cacheKey = `weather:forecast:coord:${Number(lat).toFixed(2)},${Number(lng).toFixed(2)}:${units}`;
    } else if (city) {
      queryParam = `q=${encodeURIComponent(city)}`;
      cacheKey = `weather:forecast:city:${city.toLowerCase().trim()}:${units}`;
    } else {
      return {
        success: false,
        provider: 'OpenWeather',
        error: 'lat/lng or city parameter is required.'
      };
    }

    const url = `${this.apiBase}/forecast?${queryParam}&units=${units}&appid=${apiKey}`;

    return await ApiManager.execute({
      provider: 'OpenWeather',
      cacheKey,
      cacheTtl: CacheService.TTL.WEATHER,
      action: async () => {
        const response = await ApiManager.fetchWithTimeout(url, {}, 8000);
        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.message || `OpenWeather HTTP ${response.status}`);
        }

        const data = await response.json();
        const dailyMap = new Map();

        // Group 3-hour intervals by Date
        data.list.forEach(item => {
          const dateStr = item.dt_txt.split(' ')[0];
          if (!dailyMap.has(dateStr)) {
            dailyMap.set(dateStr, {
              date: dateStr,
              dayName: new Date(item.dt * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
              temps: [],
              descriptions: [],
              icons: [],
              humidity: [],
              windSpeeds: []
            });
          }
          const dayObj = dailyMap.get(dateStr);
          dayObj.temps.push(item.main.temp);
          dayObj.humidity.push(item.main.humidity);
          dayObj.windSpeeds.push(item.wind.speed);
          if (item.weather[0]) {
            dayObj.descriptions.push(item.weather[0].description);
            dayObj.icons.push(item.weather[0].icon);
          }
        });

        // Summarize each day
        const days = Array.from(dailyMap.values()).map(d => {
          const minTemp = Math.min(...d.temps);
          const maxTemp = Math.max(...d.temps);
          const avgHumidity = Math.round(d.humidity.reduce((a, b) => a + b, 0) / d.humidity.length);
          const avgWind = (d.windSpeeds.reduce((a, b) => a + b, 0) / d.windSpeeds.length).toFixed(1);
          // Pick middle icon for representative weather
          const midIcon = d.icons[Math.floor(d.icons.length / 2)] || '01d';
          const midDesc = d.descriptions[Math.floor(d.descriptions.length / 2)] || 'Clear';

          return {
            date: d.date,
            day: d.dayName,
            minTemp: Math.round(minTemp),
            maxTemp: Math.round(maxTemp),
            description: midDesc,
            iconUrl: this.getIconUrl(midIcon),
            humidity: avgHumidity,
            windSpeed: parseFloat(avgWind)
          };
        });

        return {
          city: data.city?.name,
          country: data.city?.country,
          units: units === 'metric' ? '°C' : '°F',
          days: days.slice(0, 5)
        };
      }
    });
  }

  /**
   * Computes weather alerts & travel condition recommendations.
   */
  async getWeatherAlerts({ lat, lng }) {
    const current = await this.getCurrentWeather({ lat, lng });
    if (!current.success) return current;

    const data = current.data;
    const alerts = [];

    if (data.temperature > 40) {
      alerts.push({ level: 'WARNING', message: `Severe Heat Alert: ${data.temperature}°C. Stay hydrated and avoid midday direct sun.` });
    } else if (data.temperature < 0) {
      alerts.push({ level: 'WARNING', message: `Freezing Temperature Alert: ${data.temperature}°C. Frost and ice hazards on roadways.` });
    }

    if (data.windSpeed > 15) {
      alerts.push({ level: 'CAUTION', message: `High Winds: ${data.windSpeed} m/s. Reduced handling for two-wheelers and high-profile vehicles.` });
    }

    if (data.weather.main.toLowerCase().includes('rain') || data.weather.main.toLowerCase().includes('thunderstorm')) {
      alerts.push({ level: 'ADVISORY', message: `Precipitation Alert: ${data.weather.description}. Expect slower travel times and slippery roads.` });
    } else if (data.weather.main.toLowerCase().includes('fog') || data.weather.main.toLowerCase().includes('mist')) {
      alerts.push({ level: 'ADVISORY', message: `Low Visibility: ${data.weather.description}. Use fog lamps and maintain safe following distances.` });
    }

    return {
      success: true,
      provider: 'OpenWeather',
      cached: current.cached,
      data: {
        city: data.city,
        alerts: alerts.length > 0 ? alerts : [{ level: 'CLEAR', message: 'Optimal weather conditions for travel.' }]
      }
    };
  }
}

// Export singleton instance
module.exports = new WeatherService();
