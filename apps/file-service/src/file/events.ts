import type { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { FileEntity } from './model';
import { FileResponse, mapFile } from './mapper';

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
    securityClassification: {
      type: ['string', 'null'],
      enum: [
        'public',
        'protected a',
        'protected b',
        'protected c',
        '', //The empty string is to handle old file types that do not have a security classification
        null,
      ],
      default: 'protected a',
    },
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

function getCorrelationId(file: FileResponse) {
  return file.recordId || file.urn;
}

export function fileUploaded(apiId: AdspId, user: User, file: FileEntity): DomainEvent {
  const fileResponse = mapFile(apiId, file);
  return {
    name: FILE_UPLOADED_EVENT,
    tenantId: file.tenantId,
    timestamp: new Date(),
    correlationId: getCorrelationId(fileResponse),
    payload: {
      file: fileResponse,
      uploadedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function fileDeleted(apiId: AdspId, user: User, file: FileEntity): DomainEvent {
  const fileResponse = mapFile(apiId, file);
  return {
    name: FILE_DELETED_EVENT,
    tenantId: file.tenantId,
    timestamp: new Date(),
    correlationId: getCorrelationId(fileResponse),
    payload: {
      file: fileResponse,
      deletedBy: {
        id: user.id,
        name: user.name,
        retention: file.retentionDays,
      },
    },
  };
}

export function fileScanned(apiId: AdspId, file: FileEntity, infected: boolean): DomainEvent {
  const fileResponse = mapFile(apiId, file);
  return {
    name: FILE_SCANNED_EVENT,
    tenantId: file.tenantId,
    timestamp: new Date(),
    correlationId: getCorrelationId(fileResponse),
    payload: {
      file: fileResponse,
      infected,
    },
  };
}
