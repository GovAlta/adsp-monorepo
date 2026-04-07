import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';

export const WORKSPACE_CREATED = 'workspace-created';
export const WORKSPACE_CREATION_FAILED = 'workspace-creation-failed';
export const THREAD_CREATED = 'thread-created';
export const THREAD_DELETED = 'thread-deleted';

const userInfoSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', examples: ['user-123'] },
    name: { type: 'string', examples: ['John Smith'] },
  },
};

export const WorkspaceCreatedDefinition: DomainEventDefinition = {
  name: WORKSPACE_CREATED,
  description: 'Signalled when a workspace is created from a file upload.',
  payloadSchema: {
    type: 'object',
    properties: {
      sourceFile: {
        type: 'object',
        properties: {
          filename: { type: 'string', examples: ['project.zip'] },
          size: { type: 'number', examples: [2048576] },
          uploadedAt: { type: 'string', format: 'date-time' },
        },
      },
      createdBy: userInfoSchema,
    },
  },
};

export const WorkspaceCreationFailedDefinition: DomainEventDefinition = {
  name: WORKSPACE_CREATION_FAILED,
  description: 'Signalled when workspace creation from a file upload fails.',
  payloadSchema: {
    type: 'object',
    properties: {
      filename: { type: 'string', examples: ['project.zip'] },
      errorType: { type: 'string', examples: ['InvalidArchive'] },
      errorMessage: { type: 'string', examples: ['File is not a valid zip archive'] },
      initiatedBy: userInfoSchema,
    },
  },
};

export const ThreadCreatedDefinition: DomainEventDefinition = {
  name: THREAD_CREATED,
  description: 'Signalled when a new conversation thread is created with an agent.',
  payloadSchema: {
    type: 'object',
    properties: {
      createdBy: userInfoSchema,
    },
  },
};

export const ThreadDeletedDefinition: DomainEventDefinition = {
  name: THREAD_DELETED,
  description: 'Signalled when a thread is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {},
  },
};

/**
 * Create a workspace-created event
 */
export function workspaceCreated(
  tenantId: AdspId,
  threadId: string,
  agentId: string,
  workspaceTarball: string,
  user: User,
  sourceFile: {
    filename: string;
    size?: number;
    uploadedAt: Date;
  },
): DomainEvent {
  const sourceFilePayload: { filename: string; uploadedAt: string; size?: number } = {
    filename: sourceFile.filename,
    uploadedAt: sourceFile.uploadedAt.toISOString(),
  };
  if (typeof sourceFile.size === 'number') {
    sourceFilePayload.size = sourceFile.size;
  }

  return {
    name: WORKSPACE_CREATED,
    timestamp: new Date(),
    tenantId,
    correlationId: threadId,
    context: {
      threadId,
      agentId,
      workspaceTarball,
    },
    payload: {
      sourceFile: sourceFilePayload,
      createdBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

/**
 * Create a workspace-creation-failed event
 */
export function workspaceCreationFailed(
  tenantId: AdspId,
  threadId: string,
  agentId: string,
  workspaceTarball: string,
  user: User,
  filename: string,
  errorType: string,
  errorMessage: string,
): DomainEvent {
  return {
    name: WORKSPACE_CREATION_FAILED,
    timestamp: new Date(),
    tenantId,
    correlationId: threadId,
    context: {
      threadId,
      agentId,
      workspaceTarball,
    },
    payload: {
      filename,
      errorType,
      errorMessage,
      initiatedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

/**
 * Create a thread-created event
 */
export function threadCreated(tenantId: AdspId, threadId: string, agentId: string, user: User): DomainEvent {
  return {
    name: THREAD_CREATED,
    timestamp: new Date(),
    tenantId,
    correlationId: threadId,
    context: {
      threadId,
      agentId,
    },
    payload: {
      createdBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

/**
 * Create a thread-deleted event
 */
export function threadDeleted(tenantId: AdspId, threadId: string): DomainEvent {
  return {
    name: THREAD_DELETED,
    timestamp: new Date(),
    tenantId,
    correlationId: threadId,
    context: {
      threadId,
    },
    payload: {},
  };
}
