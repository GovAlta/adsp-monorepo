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
  linkFormat?: LinkFormat;
}

export type LinkFormat = 'hyperlink' | 'text';

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

export type PushOutcome = 'created' | 'updated';

export interface PushResult {
  itemId: string;
  outcome: PushOutcome;
}

export type TestResult = { ok: true; outcome: PushOutcome } | { ok: false; errorCode: string; column?: string };
