/**
 * ApiManager.js
 * 
 * Centralized API Gateway & Orchestrator for GlobeRoutes Backend.
 * Handles:
 *  - Rate Limiting
 *  - Exponential Backoff & Retry Logic
 *  - Request Timeout Management via AbortController
 *  - Provider Fallback Execution
 *  - Unified Response Formatting
 *  - Structured Performance & Latency Logging
 */

const CacheService = require('./CacheService');

class ApiManager {
  constructor() {
    // Rate limiter tracking: provider -> { tokens, lastRefill, capacity, refillRatePerSec }
    this.rateLimits = {
      'OpenRouteService': { tokens: 40, capacity: 40, refillRatePerSec: 1, lastRefill: Date.now() },
      'Overpass': { tokens: 10, capacity: 10, refillRatePerSec: 0.5, lastRefill: Date.now() },
      'OpenWeather': { tokens: 60, capacity: 60, refillRatePerSec: 1, lastRefill: Date.now() },
      'Amadeus': { tokens: 20, capacity: 20, refillRatePerSec: 1, lastRefill: Date.now() },
      'OSRM': { tokens: 30, capacity: 30, refillRatePerSec: 1, lastRefill: Date.now() },
      'Nominatim': { tokens: 1, capacity: 1, refillRatePerSec: 1, lastRefill: Date.now() } // Strict 1 req/sec policy
    };

    // Default configuration options
    this.DEFAULT_TIMEOUT_MS = 12000; // 12 seconds
    this.MAX_RETRIES = 2;
    this.BASE_BACKOFF_MS = 800;
  }

  /**
   * Refills token bucket rate limiter for a given provider.
   * @param {string} provider
   * @returns {boolean} true if permitted, false if rate limited
   */
  checkRateLimit(provider) {
    const limiter = this.rateLimits[provider];
    if (!limiter) return true; // No limiter defined, allow

    const now = Date.now();
    const elapsedSec = (now - limiter.lastRefill) / 1000;
    limiter.tokens = Math.min(limiter.capacity, limiter.tokens + elapsedSec * limiter.refillRatePerSec);
    limiter.lastRefill = now;

    if (limiter.tokens >= 1) {
      limiter.tokens -= 1;
      return true;
    }

    return false;
  }

  /**
   * Waits for token availability if rate limited.
   * @param {string} provider
   * @param {number} maxWaitMs
   */
  async waitForRateLimit(provider, maxWaitMs = 3000) {
    const start = Date.now();
    while (!this.checkRateLimit(provider)) {
      if (Date.now() - start > maxWaitMs) {
        throw new Error(`Rate limit exceeded for provider '${provider}'.`);
      }
      await new Promise(res => setTimeout(res, 300));
    }
  }

  /**
   * Performs an HTTP fetch request with timeout and abort handling.
   * @param {string} url
   * @param {RequestInit} [options]
   * @param {number} [timeoutMs]
   * @returns {Promise<Response>}
   */
  async fetchWithTimeout(url, options = {}, timeoutMs = this.DEFAULT_TIMEOUT_MS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal
      });
      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms: ${url}`);
      }
      throw err;
    }
  }

  /**
   * Executes an API task with automatic caching, retries, rate limiting, and performance logging.
   * @template T
   * @param {Object} params
   * @param {string} params.provider - Name of the external provider (e.g. 'OpenRouteService')
   * @param {string} [params.cacheKey] - Cache key if caching is desired
   * @param {number} [params.cacheTtl] - TTL in ms
   * @param {() => Promise<T>} params.action - Function that performs the API call and returns raw data
   * @param {number} [params.timeoutMs] - Custom timeout in ms
   * @param {number} [params.retries] - Max retry attempts
   * @returns {Promise<{ success: boolean, provider: string, cached: boolean, data?: T, error?: string }>}
   */
  async execute({
    provider,
    cacheKey = null,
    cacheTtl = null,
    action,
    timeoutMs = this.DEFAULT_TIMEOUT_MS,
    retries = this.MAX_RETRIES
  }) {
    const startTime = Date.now();

    // 1. Check Cache
    if (cacheKey) {
      const cached = CacheService.get(cacheKey);
      if (cached !== null) {
        const latency = Date.now() - startTime;
        console.log(`[ApiManager] 🟢 CACHE HIT | Provider: ${provider} | Key: ${cacheKey} | Latency: ${latency}ms`);
        return {
          success: true,
          provider,
          cached: true,
          data: cached
        };
      }
    }

    console.log(`[ApiManager] 🔵 FETCH | Provider: ${provider} | CacheKey: ${cacheKey || 'N/A'}`);

    // 2. Rate limiting check
    try {
      await this.waitForRateLimit(provider);
    } catch (rateErr) {
      console.warn(`[ApiManager] ⚠️ RATE LIMIT BLOCK | Provider: ${provider} | Error: ${rateErr.message}`);
      return {
        success: false,
        provider,
        error: rateErr.message
      };
    }

    // 3. Execution with Exponential Backoff Retries
    let attempt = 0;
    let lastError = null;

    while (attempt <= retries) {
      try {
        const result = await action();
        const latency = Date.now() - startTime;
        console.log(`[ApiManager] ✅ SUCCESS | Provider: ${provider} | Latency: ${latency}ms | Retries: ${attempt}`);

        // Store into cache if key & ttl provided
        if (cacheKey && result !== null && result !== undefined) {
          CacheService.set(cacheKey, result, cacheTtl || CacheService.TTL.ROUTES);
        }

        return {
          success: true,
          provider,
          cached: false,
          data: result
        };
      } catch (err) {
        attempt++;
        lastError = err;
        const isTransient = this.isTransientError(err);
        console.warn(`[ApiManager] ⚠️ ATTEMPT ${attempt}/${retries + 1} FAILED | Provider: ${provider} | Error: ${err.message} | Transient: ${isTransient}`);

        if (attempt <= retries && isTransient) {
          const backoff = this.BASE_BACKOFF_MS * Math.pow(2, attempt - 1);
          await new Promise(r => setTimeout(r, backoff));
        } else {
          break;
        }
      }
    }

    const totalLatency = Date.now() - startTime;
    console.error(`[ApiManager] ❌ FAILURE | Provider: ${provider} | Latency: ${totalLatency}ms | Final Error: ${lastError?.message}`);

    return {
      success: false,
      provider,
      error: lastError?.message || 'External API request failed'
    };
  }

  /**
   * Executes a primary provider with an automatic fallback provider if the primary fails.
   * @template T
   * @param {Object} params
   * @param {string} params.primaryProvider
   * @param {string} params.fallbackProvider
   * @param {string} [params.cacheKey]
   * @param {number} [params.cacheTtl]
   * @param {() => Promise<T>} params.primaryAction
   * @param {() => Promise<T>} params.fallbackAction
   * @returns {Promise<{ success: boolean, provider: string, cached: boolean, data?: T, error?: string }>}
   */
  async executeWithFallback({
    primaryProvider,
    fallbackProvider,
    cacheKey = null,
    cacheTtl = null,
    primaryAction,
    fallbackAction
  }) {
    // Try Primary Provider
    const primaryResult = await this.execute({
      provider: primaryProvider,
      cacheKey,
      cacheTtl,
      action: primaryAction,
      retries: 1
    });

    if (primaryResult.success) {
      return primaryResult;
    }

    console.warn(`[ApiManager] 🔄 TRIGGERING FALLBACK | Primary (${primaryProvider}) failed -> Trying Fallback (${fallbackProvider})`);

    // Try Fallback Provider
    const fallbackResult = await this.execute({
      provider: fallbackProvider,
      cacheKey,
      cacheTtl,
      action: fallbackAction,
      retries: 1
    });

    return fallbackResult;
  }

  /**
   * Determines if an error is likely transient and recoverable via retry.
   * @param {Error} error
   * @returns {boolean}
   */
  isTransientError(error) {
    if (!error) return false;
    const msg = error.message.toLowerCase();
    return (
      msg.includes('rate limit') ||
      msg.includes('timed out') ||
      msg.includes('429') ||
      msg.includes('502') ||
      msg.includes('503') ||
      msg.includes('504') ||
      msg.includes('econnreset') ||
      msg.includes('etimedout') ||
      msg.includes('network')
    );
  }
}

// Export singleton instance
module.exports = new ApiManager();
