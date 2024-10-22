import { CachedResponse } from './types';

export interface CacheProvider {
  get(key: string): Promise<CachedResponse>;
  set(key: string, invalidateKey: string, ttl: number, value: CachedResponse): Promise<void>;
  del(invalidateKey: string): Promise<boolean>;
}
