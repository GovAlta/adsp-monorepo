export const OPERATION_REPLACE = 'REPLACE';
export interface ReplaceRequest {
  operation: typeof OPERATION_REPLACE;
  configuration: Record<string, unknown>;
}

export const OPERATION_UPDATE = 'UPDATE';
export interface UpdateRequest {
  operation: typeof OPERATION_UPDATE;
  update: Record<string, unknown>;
}

export const OPERATION_DELETE = 'DELETE';
export interface DeleteRequest {
  operation: typeof OPERATION_DELETE;
  property: string;
}

export type PatchRequests = ReplaceRequest | UpdateRequest | DeleteRequest;
