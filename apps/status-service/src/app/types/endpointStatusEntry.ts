export interface EndpointStatusEntry {
  ok: boolean;
  url: string;
  timestamp: number;
  responseTime: number;
  status: number | string;
}

export interface EndpointStatusEntryRepositoryOptions {
  limit: number;
  everyMilliseconds: number;
}
