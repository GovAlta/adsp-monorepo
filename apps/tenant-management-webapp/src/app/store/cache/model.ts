export interface CacheTarget {
  urn: string;
  ttl: number;
  invalidationEvents?: InvalidationEvent[];
}

export interface InvalidationEvent {
  namespace: string;
  name: string;
  resourceIdPath?: string | string[];
}

export const defaultCacheTarget: CacheTarget = {
  urn: '',
  ttl: 900,
  invalidationEvents: [],
};

export interface CacheState {
  targets: { tenant: Record<string, CacheTarget>; core: Record<string, CacheTarget> };
  nextEntries: string | null;
}
