export interface DataRegisterDefinition {
  description?: string;
  configurationSchema?: unknown;
  anonymousRead?: boolean;
}

export interface DataRegisterCreateRequest {
  namespace?: string;
  name: string;
  description?: string;
  entries?: string[];
}

export interface DataRegisterUpdateRequest {
  description?: string;
  entries?: string[];
}

export interface ConfigurationPatchResponse<T> {
  latest: {
    revision: number;
    configuration: T;
  };
}

export interface DataRegisterResponse {
  namespace: string;
  name: string;
  description: string;
  entries: string[];
}

export interface ConfigurationUpdateOperation<T> {
  operation: 'UPDATE';
  update: Record<string, T>;
}

export interface ConfigurationReplaceOperation<T> {
  operation: 'REPLACE';
  configuration: T;
}

export const SEND_CODE_OPERATION = 'send-code';
export const UNLOCK_FORM_OPERATION = 'unlock';
export const SUBMIT_FORM_OPERATION = 'submit';
export const ARCHIVE_FORM_OPERATION = 'archive';
export const SET_TO_DRAFT_FORM_OPERATION = 'to-draft';

interface SendCodeOperation {
  operation: typeof SEND_CODE_OPERATION;
}

interface UnlockFormOperation {
  operation: typeof UNLOCK_FORM_OPERATION;
}
interface SetToDraftFormOperation {
  operation: typeof SET_TO_DRAFT_FORM_OPERATION;
}

interface SubmitFormOperation {
  operation: typeof SUBMIT_FORM_OPERATION;
}

interface ArchiveFormOperation {
  operation: typeof ARCHIVE_FORM_OPERATION;
}

export type FormOperations =
  | SendCodeOperation
  | UnlockFormOperation
  | SubmitFormOperation
  | ArchiveFormOperation
  | SetToDraftFormOperation;
