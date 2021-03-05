export interface ApiStatusState {
  uptime: number | string | undefined;
  status: 'fetching' | 'loaded' | 'failed';
}
