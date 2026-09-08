import { metrics } from '@opentelemetry/api';
import type { Counter, MeterProvider } from '@opentelemetry/api';

/**
 * Names of the caches the SDK instruments. Held as constants so the metric keeps a small fixed
 * label set: cache name x result is the whole of its cardinality.
 */
export const CacheName = {
  Configuration: 'configuration',
  Directory: 'directory',
  Tenant: 'tenant',
  Issuer: 'issuer',
  JwksClient: 'jwks-client',
} as const;

// Counter, initialized explicitly by initializeCacheMetrics() to avoid race conditions.
let cacheLookups: Counter | undefined;
let isExplicitlyInitialized = false;

/**
 * Initialize cache metrics with an explicit MeterProvider.
 * Call this during platform initialization so the counter is created against the configured
 * provider before any lookups are recorded. Subsequent calls are no-ops.
 * @param meterProvider The MeterProvider to use for cache instrumentation
 */
export function initializeCacheMetrics(meterProvider: MeterProvider): void {
  if (!isExplicitlyInitialized) {
    cacheLookups = meterProvider.getMeter('adsp-service-sdk').createCounter('adsp.cache.lookups', {
      description: 'Cache lookups recorded by ADSP SDK caches, by outcome.',
      unit: '{lookup}',
    });
    isExplicitlyInitialized = true;
  }
}

function getCacheLookupCounter(): Counter {
  if (!cacheLookups) {
    // Fallback: if not explicitly initialized, try the global provider. Lookups made during
    // initialization -- the tenant preload, and directory reads needed to resolve it -- happen
    // before the meter provider exists and are not recorded.
    cacheLookups = metrics.getMeter('adsp-service-sdk').createCounter('adsp.cache.lookups', {
      description: 'Cache lookups recorded by ADSP SDK caches, by outcome.',
      unit: '{lookup}',
    });
  }
  return cacheLookups;
}

/**
 * Record the outcome of a cache lookup.
 *
 * Call this once per *logical* lookup, at the point the cache is first consulted. The SDK caches
 * all follow a read-through shape -- get, and on a miss refresh and get again -- so recording at
 * every `get` would count a single lookup as both a miss and a hit and make the hit ratio
 * meaningless.
 *
 * @param cache Name of the cache, from CacheName for SDK caches
 * @param hit Whether the value was already cached
 */
export function recordCacheResult(cache: string, hit: boolean): void {
  getCacheLookupCounter().add(1, {
    'adsp.cache.name': cache,
    'adsp.cache.result': hit ? 'hit' : 'miss',
  });
}
