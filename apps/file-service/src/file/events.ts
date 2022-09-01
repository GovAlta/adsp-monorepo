import type { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import type { File } from './types';

export const FILE_UPLOADED_EVENT = 'file-uploaded';
export const FILE_DELETED_EVENT = 'file-deleted';
export const FILE_SCANNED_EVENT = 'file-scanned';

const fileSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    recordId: { oneOf: [{ type: 'string' }, { type: 'null' }] },
    filename: { type: 'string' },
    size: { type: 'number' },
    createdBy: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
    created: { type: 'string', format: 'date-time' },
    lastAccessed: { type: 'string', format: 'date-time' },
  },
};
export const FileUploadedDefinition: DomainEventDefinition = {
  name: FILE_UPLOADED_EVENT,
  description: 'Signalled when a file is uploaded.',
  payloadSchema: {
    type: 'object',
    properties: {
      uploadedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      file: fileSchema,
    },
  },
};

export const FileDeletedDefinition: DomainEventDefinition = {
  name: FILE_DELETED_EVENT,
  description: 'Signalled when a file is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      deletedBy: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
      file: fileSchema,
    },
  },
  interval: {
    namespace: 'file-service',
    name: FILE_UPLOADED_EVENT,
    metric: ['file-service', 'file-lifetime'],
  },
};

export const FileScannedDefinition: DomainEventDefinition = {
  name: FILE_SCANNED_EVENT,
  description: 'Signalled when a file is scanned.',
  payloadSchema: {
    type: 'object',
    properties: {
      infected: { type: 'boolean' },
      file: fileSchema,
    },
  },
  interval: {
    namespace: 'file-service',
    name: FILE_UPLOADED_EVENT,
    metric: ['file-service', 'file-scan-time'],
  },
};

export function fileUploaded(tenantId: AdspId, user: User, file: File): DomainEvent {
  return {
    name: FILE_UPLOADED_EVENT,
    tenantId,
    timestamp: new Date(),
    correlationId: file.recordId || file.id,
    payload: {
      file,
      uploadedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function fileDeleted(user: User, file: File): DomainEvent {
  return {
    name: FILE_DELETED_EVENT,
    tenantId: user.tenantId,
    timestamp: new Date(),
    correlationId: file.recordId || file.id,
    payload: {
      file,
      deletedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function fileScanned(tenantId: AdspId, file: File, infected: boolean): DomainEvent {
  return {
    name: FILE_SCANNED_EVENT,
    tenantId,
    timestamp: new Date(),
    correlationId: file.recordId || file.id,
    payload: {
      file,
      infected,
    },
  };
}
