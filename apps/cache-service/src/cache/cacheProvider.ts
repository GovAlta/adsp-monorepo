import { CachedResponse } from './types';

export interface CacheProvider {
  get(key: string): Promise<CachedResponse>;
  set(key: string, ttl: number, value: CachedResponse): Promise<void>;
}
