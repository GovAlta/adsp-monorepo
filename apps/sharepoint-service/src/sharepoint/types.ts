export interface SharePointConnection {
  id: string;
  name: string;
  entraTenantId: string;
  clientId: string;
  siteId: string;
}

export interface FieldMapping {
  source: string;
  target: string;
}

export interface SharePointDestination {
  id: string;
  name: string;
  connectionId: string;
  listId: string;
  fieldMappings: FieldMapping[];
  idempotencyFields?: string[];
  enabled?: boolean;
}

export interface SharePointConfiguration {
  connections?: Record<string, SharePointConnection>;
  destinations?: Record<string, SharePointDestination>;
}

export type TestResult = { ok: true } | { ok: false; errorCode: string; column?: string };
