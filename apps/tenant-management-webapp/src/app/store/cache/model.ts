export interface CacheTarget {
  urn: string;
  ttl: string;
  invalidationEvents?: Array<{
    namespace: string;
    name: string;
    resourceIdPath: string | string[];
  }>;
}
export const defaultCacheTarget: CacheTarget = {
  urn: '',
  ttl: undefined,
  invalidationEvents: [],
};

export interface CacheState {
  targets: Record<string, CacheTarget>;
  nextEntries: string | null;
}
