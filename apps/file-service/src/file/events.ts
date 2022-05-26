import type { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import type { File } from './types';

export const FILE_UPLOADED_EVENT = 'file-uploaded';
export const FILE_DELETED_EVENT = 'file-deleted';

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
      file: {
        type: 'object',
      },
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
      file: {
        type: 'object',
      },
    },
  },
  interval: {
    namespace: 'file-service',
    name: FILE_UPLOADED_EVENT,
    metric: ['file-service', 'file-lifetime'],
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
