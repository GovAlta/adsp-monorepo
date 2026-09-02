import type { MeterProvider } from '@opentelemetry/api';
import { CacheName, initializeCacheMetrics, recordCacheResult } from './cache';

describe('cache metrics', () => {
  const add = jest.fn();
  const createCounter = jest.fn().mockReturnValue({ add });

  beforeAll(() => {
    initializeCacheMetrics({ getMeter: () => ({ createCounter }) } as unknown as MeterProvider);
  });

  beforeEach(() => {
    add.mockClear();
  });

  it('can create the counter on the configured provider', () => {
    expect(createCounter).toHaveBeenCalledWith('adsp.cache.lookups', expect.objectContaining({ unit: '{lookup}' }));
  });

  it('can record a hit', () => {
    recordCacheResult(CacheName.Configuration, true);
    expect(add).toHaveBeenCalledWith(1, { 'adsp.cache.name': 'configuration', 'adsp.cache.result': 'hit' });
  });

  it('can record a miss', () => {
    recordCacheResult(CacheName.Directory, false);
    expect(add).toHaveBeenCalledWith(1, { 'adsp.cache.name': 'directory', 'adsp.cache.result': 'miss' });
  });

  it('can keep the label set to cache name and result only', () => {
    recordCacheResult(CacheName.Tenant, true);
    // The whole point of the fixed CacheName set: nothing per-tenant or per-key reaches the labels.
    expect(Object.keys(add.mock.calls[0][1]).sort()).toEqual(['adsp.cache.name', 'adsp.cache.result']);
  });
});
