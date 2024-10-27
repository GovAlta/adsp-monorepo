import { AdspId, DomainEvent, DomainEventDefinition, Stream, User } from '@abgov/adsp-service-sdk';
import { FileResult } from '@core-services/job-common';
import { ServiceRoles } from './roles';

export const ExportQueuedDefinition: DomainEventDefinition = {
  name: 'export-queued',
  description: '',
  payloadSchema: {
    jobId: { type: 'string' },
    resourceId: { type: 'string' },
    format: { type: 'string' },
    filename: { type: 'string' },
    requestedBy: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
  },
};

export const ExportCompletedDefinition: DomainEventDefinition = {
  name: 'export-completed',
  description: '',
  payloadSchema: {
    jobId: { type: 'string' },
    resourceId: { type: 'string' },
    format: { type: 'string' },
    file: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        urn: { type: 'string' },
        filename: { type: 'string' },
      },
    },
    requestedBy: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
  },
  interval: {
    namespace: 'export-service',
    name: ExportQueuedDefinition.name,
    metric: ['export-service', 'export'],
  },
};

export const ExportFailedDefinition: DomainEventDefinition = {
  name: 'export-failed',
  description: '',
  payloadSchema: {
    jobId: { type: 'string' },
    resourceId: { type: 'string' },
    format: { type: 'string' },
    filename: { type: 'string' },
    requestedBy: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
  },
};

export const ExportGenerationUpdatesStream: Stream = {
  id: 'export-updates',
  name: 'Export updates',
  description: 'Provides update events for export.',
  subscriberRoles: [`urn:ads:platform:export-service:${ServiceRoles.Exporter}`],
  publicSubscribe: false,
  events: [
    {
      namespace: 'export-service',
      name: ExportQueuedDefinition.name,
    },
    {
      namespace: 'export-service',
      name: ExportCompletedDefinition.name,
    },
    {
      namespace: 'export-service',
      name: ExportFailedDefinition.name,
    },
  ],
};

export const exportQueued = (
  tenantId: AdspId,
  requestedBy: Pick<User, 'id' | 'name'>,
  jobId: string,
  resourceId: AdspId,
  format: string,
  filename: string
): DomainEvent => ({
  name: ExportQueuedDefinition.name,
  tenantId,
  timestamp: new Date(),
  payload: {
    jobId,
    resourceId: resourceId.toString(),
    format,
    filename,
    requestedBy: {
      id: requestedBy.id,
      name: requestedBy.name,
    },
  },
});

export const exported = (
  tenantId: AdspId,
  requestedBy: Pick<User, 'id' | 'name'>,
  jobId: string,
  resourceId: AdspId,
  format: string,
  file: FileResult
): DomainEvent => ({
  name: ExportCompletedDefinition.name,
  tenantId,
  timestamp: new Date(),
  payload: {
    jobId,
    resourceId: resourceId.toString(),
    format,
    file: {
      id: file.id,
      urn: file.urn,
      filename: file.filename,
    },
    requestedBy: {
      id: requestedBy.id,
      name: requestedBy.name,
    },
  },
});

export const exportFailed = (
  tenantId: AdspId,
  requestedBy: Pick<User, 'id' | 'name'>,
  jobId: string,
  resourceId: string,
  format: string,
  filename: string
): DomainEvent => ({
  name: ExportFailedDefinition.name,
  tenantId,
  timestamp: new Date(),
  payload: {
    jobId,
    resourceId,
    format,
    filename,
    requestedBy: {
      id: requestedBy.id,
      name: requestedBy.name,
    },
  },
});
