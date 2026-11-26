import type { AdspId, DomainEvent, DomainEventDefinition, EventService, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';

const userSchema = { type: 'object', properties: { id: { type: 'string' }, name: { type: 'string' } } };

export const CredentialSetDefinition: DomainEventDefinition = {
  name: 'credential-set',
  description:
    "Signalled when a SharePoint connection's client secret is saved, for the first time or as a replacement.",
  payloadSchema: {
    type: 'object',
    properties: { connectionId: { type: 'string' }, updatedBy: userSchema },
  },
};

export const CredentialDeletedDefinition: DomainEventDefinition = {
  name: 'credential-deleted',
  description: "Signalled when a SharePoint connection's client secret is deleted.",
  payloadSchema: {
    type: 'object',
    properties: { connectionId: { type: 'string' }, deletedBy: userSchema },
  },
};

export const PushFailedDefinition: DomainEventDefinition = {
  name: 'push-failed',
  description:
    'Signalled when a row could not be written to a destination for a reason an admin has to fix, such as a ' +
    'rejected secret, a disabled destination or a missing column. Failures a retry can fix are not signalled.',
  payloadSchema: {
    type: 'object',
    properties: {
      destinationId: { type: 'string' },
      errorCode: { type: 'string' },
      column: { type: 'string' },
      dataId: { type: 'string' },
    },
  },
};

export const FileUploadFailedDefinition: DomainEventDefinition = {
  name: 'file-upload-failed',
  description:
    'Signalled once per files request when files could not be uploaded to a destination for a reason an admin has ' +
    'to fix, such as a rejected secret or denied access. Failures a retry can fix are not signalled.',
  payloadSchema: {
    type: 'object',
    properties: {
      destinationId: { type: 'string' },
      submissionId: { type: 'string' },
      files: {
        type: 'array',
        items: {
          type: 'object',
          properties: { field: { type: 'string' }, fileId: { type: 'string' }, errorCode: { type: 'string' } },
        },
      },
    },
  },
};

export const SharePointEventDefinitions: DomainEventDefinition[] = [
  CredentialSetDefinition,
  CredentialDeletedDefinition,
  PushFailedDefinition,
  FileUploadFailedDefinition,
];

export interface PushFailure {
  errorCode: string;
  column?: string;
  dataId?: string;
}

export interface FileFailure {
  field: string;
  fileId: string;
  errorCode: string;
}

const actorOf = ({ id, name }: User) => ({ id, name });

export type EventSignal = (event: DomainEvent) => void;

// The SDK's send is typed void but returns a promise, so a failure is caught on both paths and never fails the request.
export function createEventSignal(eventService: EventService, logger: Logger): EventSignal {
  return (event) => {
    const logFailure = () =>
      logger.warn(`Event ${event.name} was not sent.`, {
        context: 'SharePointEvents',
        tenant: event.tenantId?.toString(),
      });
    try {
      Promise.resolve(eventService.send(event)).catch(logFailure);
    } catch {
      logFailure();
    }
  };
}

export const credentialSet = (tenantId: AdspId, connectionId: string, user: User): DomainEvent => ({
  name: CredentialSetDefinition.name,
  tenantId,
  timestamp: new Date(),
  payload: { connectionId, updatedBy: actorOf(user) },
});

export const credentialDeleted = (tenantId: AdspId, connectionId: string, user: User): DomainEvent => ({
  name: CredentialDeletedDefinition.name,
  tenantId,
  timestamp: new Date(),
  payload: { connectionId, deletedBy: actorOf(user) },
});

export const pushFailed = (
  tenantId: AdspId,
  destinationId: string,
  { errorCode, column, dataId }: PushFailure,
  correlationId: string | undefined,
): DomainEvent => ({
  name: PushFailedDefinition.name,
  tenantId,
  timestamp: new Date(),
  ...(correlationId ? { correlationId } : {}),
  context: { destinationId },
  payload: { destinationId, errorCode, ...(column ? { column } : {}), ...(dataId ? { dataId } : {}) },
});

export const fileUploadFailed = (
  tenantId: AdspId,
  destinationId: string,
  submissionId: string,
  files: FileFailure[],
): DomainEvent => ({
  name: FileUploadFailedDefinition.name,
  tenantId,
  timestamp: new Date(),
  correlationId: submissionId,
  context: { destinationId, submissionId },
  payload: { destinationId, submissionId, files },
});
