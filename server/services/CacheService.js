/**
 * CacheService.js
 * 
 * High-performance In-Memory TTL Cache for GlobeRoutes Backend Services.
 * Provides granular TTL management, automatic expired key cleanup,
 * pattern invalidation, and metrics logging.
 */

class CacheService {
  constructor() {
    this.store = new Map();
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      invalidations: 0
    };

    // Standard TTL specifications (in milliseconds)
    this.TTL = {
      ROUTES: 24 * 60 * 60 * 1000,      // 24 hours
      WEATHER: 30 * 60 * 1000,          // 30 minutes
      POIS: 12 * 60 * 60 * 1000,         // 12 hours
      AIRPORTS: 24 * 60 * 60 * 1000,     // 24 hours
      STATIONS: 24 * 60 * 60 * 1000,     // 24 hours
      GEOCODE: 24 * 60 * 60 * 1000,      // 24 hours
      FLIGHTS: 30 * 60 * 1000           // 30 minutes for live flight searches
    };

    // Background cleanup timer every 5 minutes to reclaim memory
    this.cleanupInterval = setInterval(() => this.cleanupExpired(), 5 * 60 * 1000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref(); // Prevent timer from keeping Node process alive during tests
    }
  }

  /**
   * Retrieves an item from cache if not expired.
   * @param {string} key
   * @returns {any|null}
   */
  get(key) {
    if (!key) return null;
    const record = this.store.get(key);

    if (!record) {
      this.stats.misses++;
      return null;
    }

    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      this.stats.misses++;
      return null;
    }

    this.stats.hits++;
    return record.value;
  }

  /**
   * Stores an item in cache with a defined TTL.
   * @param {string} key
   * @param {any} value
   * @param {number} [ttlMs] Time to live in ms (defaults to 1 hour if not provided)
   */
  set(key, value, ttlMs = 60 * 60 * 1000) {
    if (!key || value === undefined) return;

    this.store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
      createdAt: Date.now()
    });

    this.stats.sets++;
  }

  /**
   * Checks if a non-expired key exists in cache.
   * @param {string} key
   * @returns {boolean}
   */
  has(key) {
    if (!key) return false;
    const record = this.store.get(key);
    if (!record) return false;
    if (Date.now() > record.expiresAt) {
      this.store.delete(key);
      return false;
    }
    return true;
  }

  /**
   * Invalidates a specific key or keys matching a regex/prefix.
   * @param {string|RegExp} pattern
   * @returns {number} Number of keys deleted
   */
  invalidate(pattern) {
    let deletedCount = 0;

    if (typeof pattern === 'string') {
      if (this.store.delete(pattern)) {
        deletedCount++;
      }
    } else if (pattern instanceof RegExp) {
      for (const key of this.store.keys()) {
        if (pattern.test(key)) {
          this.store.delete(key);
          deletedCount++;
        }
      }
    }

    this.stats.invalidations += deletedCount;
    return deletedCount;
  }

  /**
   * Cleans up all expired records.
   */
  cleanupExpired() {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (now > record.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  /**
   * Returns current cache statistics.
   */
  getStats() {
    return {
      size: this.store.size,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate: this.stats.hits + this.stats.misses > 0 
        ? `${((this.stats.hits / (this.stats.hits + this.stats.misses)) * 100).toFixed(1)}%` 
        : '0.0%',
      sets: this.stats.sets,
      invalidations: this.stats.invalidations
    };
  }

  /**
   * Clears the entire cache store.
   */
  clear() {
    this.store.clear();
  }
}

// Export singleton instance
module.exports = new CacheService();
