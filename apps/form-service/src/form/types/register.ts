export type DataRegisterEntry = string | Record<string, unknown>;

export interface DataRegisterDefinition {
  configurationSchema: unknown;
  description?: string;
  anonymousRead?: boolean;
}

export interface DataRegisterCreateRequest {
  name: string;
  description?: string;
  entries?: DataRegisterEntry[];
}

export interface DataRegisterUpdateRequest {
  description?: string;
  entries?: DataRegisterEntry[];
}

export interface DataRegisterResponse {
  namespace: string;
  name: string;
  description: string;
  entries: DataRegisterEntry[];
}
