import type { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';

export const FILE_UPLOADED_EVENT = 'file-uploaded';
export const FILE_UPLOAD_FAILED_EVENT = 'file-upload-failed';

const requestProperties = {
  destinationId: { type: 'string' },
  submissionId: { type: 'string' },
  field: { type: 'string' },
  fileId: { type: 'string' },
};

export const FileUploadedDefinition: DomainEventDefinition = {
  name: FILE_UPLOADED_EVENT,
  description: 'Signalled when a file is uploaded to the SharePoint document library of a destination.',
  payloadSchema: {
    type: 'object',
    properties: {
      ...requestProperties,
      sharepointFileId: { type: 'string' },
      size: { type: 'number' },
    },
  },
};

export const FileUploadFailedDefinition: DomainEventDefinition = {
  name: FILE_UPLOAD_FAILED_EVENT,
  description: 'Signalled when a file could not be uploaded to the SharePoint document library of a destination.',
  payloadSchema: {
    type: 'object',
    properties: {
      ...requestProperties,
      errorCode: { type: 'string' },
      retryable: { type: 'boolean' },
    },
  },
};

interface FileEventRequest {
  tenantId: AdspId;
  destinationId: string;
  submissionId: string;
  field: string;
  fileId: string;
}

function baseEvent(name: string, request: FileEventRequest): Omit<DomainEvent, 'payload'> {
  return {
    name,
    tenantId: request.tenantId,
    timestamp: new Date(),
    correlationId: request.submissionId,
    context: { destinationId: request.destinationId, submissionId: request.submissionId },
  };
}

function requestPayload({ destinationId, submissionId, field, fileId }: FileEventRequest) {
  return { destinationId, submissionId, field, fileId };
}

export function fileUploaded(request: FileEventRequest, sharepointFileId: string, size: number): DomainEvent {
  return {
    ...baseEvent(FILE_UPLOADED_EVENT, request),
    payload: { ...requestPayload(request), sharepointFileId, size },
  };
}

export function fileUploadFailed(request: FileEventRequest, errorCode: string, retryable: boolean): DomainEvent {
  return {
    ...baseEvent(FILE_UPLOAD_FAILED_EVENT, request),
    payload: { ...requestPayload(request), errorCode, retryable },
  };
}
