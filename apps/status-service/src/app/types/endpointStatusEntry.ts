export interface EndpointStatusEntry {
  ok: boolean;
  url: string;
  timestamp: number;
  responseTime: number;
  status: number | string;
  applicationId: string;
  tenantId: string;
}

export interface EndpointStatusEntryRepositoryOptions {
  limit: number;
  everyMilliseconds: number;
  ageInMinutes: number;
}
