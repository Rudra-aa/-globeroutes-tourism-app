class DatasetLoader {
  constructor() {
    this.countryIndex = null;
    this.loadedCountries = {};
    this.baseUrl = window.location.origin + window.location.pathname.replace(/\/[^\/]*$/, '');
  }

  async initialize() {
    try {
      const response = await fetch(`${this.baseUrl}/js/data/index.json`);
      if (response.ok) {
        this.countryIndex = await response.json();
        console.log('DatasetLoader: Index loaded successfully', this.countryIndex);
      } else {
        console.warn('DatasetLoader: Failed to load index.json');
      }
    } catch (error) {
      console.error('DatasetLoader: Initialization error', error);
    }
  }

  async loadCountryData(countryKey) {
    if (this.loadedCountries[countryKey]) {
      return this.loadedCountries[countryKey];
    }

    if (!this.countryIndex || !this.countryIndex.countries[countryKey]) {
      console.warn(`DatasetLoader: No data path found for country key '${countryKey}'`);
      return null;
    }

    const dataPath = this.countryIndex.countries[countryKey];
    try {
      const response = await fetch(`${this.baseUrl}/js/${dataPath}`);
      if (response.ok) {
        const data = await response.json();
        this.loadedCountries[countryKey] = data;
        return data;
      }
    } catch (error) {
      console.error(`DatasetLoader: Failed to load data for ${countryKey}`, error);
    }
    return null;
  }

  async searchCityData(cityName) {
    // Search across loaded countries (lazy loading could be implemented later)
    for (const key in this.loadedCountries) {
      const countryData = this.loadedCountries[key];
      const city = countryData.cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
      if (city) {
        return city;
      }
    }
    // If not found in loaded memory, attempt to load all countries sequentially
    // (In a real production system, a backend database is preferred. For now, we search all available files)
    if (this.countryIndex) {
      for (const key in this.countryIndex.countries) {
        if (!this.loadedCountries[key]) {
          const countryData = await this.loadCountryData(key);
          if (countryData) {
            const city = countryData.cities.find(c => c.name.toLowerCase() === cityName.toLowerCase());
            if (city) {
              return city;
            }
          }
        }
      }
    }
    return null;
  }
}

window.DatasetLoader = new DatasetLoader();
window.DatasetLoader.initialize();
