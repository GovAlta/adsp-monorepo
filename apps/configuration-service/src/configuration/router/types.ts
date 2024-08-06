export const OPERATION_REPLACE = 'REPLACE';
export interface ReplaceRequest {
  operation: typeof OPERATION_REPLACE;
  configuration: Record<string, unknown>;
}

export interface UpdateRequest {
  operation: typeof OPERATION_UPDATE;
  update: Record<string, unknown>;
}

export const OPERATION_DELETE = 'DELETE';
export interface DeleteRequest {
  operation: typeof OPERATION_DELETE;
  property: string;
}

export interface CreateRevisionRequest {
  operation: typeof OPERATION_CREATE_REVISION;
}

export interface SetActiveRevision {
  operation: typeof OPERATION_SET_ACTIVE_REVISION;
  setActiveRevision?: number;
  revision?: number;
}
export type PostRequests = CreateRevisionRequest | SetActiveRevision;

export const OPERATION_CREATE_REVISION = 'CREATE-REVISION';
export const OPERATION_SET_ACTIVE_REVISION = 'SET-ACTIVE-REVISION';

export const OPERATION_UPDATE = 'UPDATE';
export type PatchRequests = ReplaceRequest | UpdateRequest | DeleteRequest;
