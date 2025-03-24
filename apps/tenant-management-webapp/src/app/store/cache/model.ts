export interface CacheTarget {
  id: string;
  name: string;
  ttl: number;
  invalidationEvents?: Array<{
    namespace: string;
    name: string;
    resourceIdPath: string | string[];
  }>;
}
export const defaultCacheTarget: CacheTarget = {
  id: '',
  name: '',
  ttl: undefined,
  invalidationEvents: [],
};

export interface CacheState {
  targets: Record<string, CacheTarget>;
  nextEntries: string | null;
}
