export type ExportStatus = 'queued' | 'completed' | 'failed';
export type ExportFormat = 'json' | 'csv';

export interface CacheTarget {
  id: string;
  name: string;
}
export const defaultCacheTarget: CacheTarget = {
  id: '',
  name: '',
};

export interface CacheState {
  targets: Record<string, CacheTarget>;
  nextEntries: string | null;
}
