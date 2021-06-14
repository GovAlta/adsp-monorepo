import type { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import type { File } from './types';

export const FileUploadedDefinition: DomainEventDefinition = {
  name: 'file-uploaded',
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
  name: 'file-deleted',
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
};

export function fileUploaded(user: User, file: File): DomainEvent {
  return {
    name: 'file-uploaded',
    tenantId: user.tenantId,
    timestamp: new Date(),
    correlationId: file.recordId,
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
    name: 'file-deleted',
    tenantId: user.tenantId,
    timestamp: new Date(),
    correlationId: file.recordId,
    payload: {
      file,
      deletedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}
