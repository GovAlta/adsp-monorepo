import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Comment, Topic } from './types';
import { TopicResponse, mapTopic } from './mapper';

const userSchema = {
  type: 'object',
  properties: {
    id: {
      type: 'string',
    },
    name: {
      type: 'string',
    },
  },
};

const topicSchema = {
  type: 'object',
  properties: {
    typeId: { type: 'string' },
    id: { type: 'integer' },
    name: { type: 'string' },
    description: { type: ['string', 'null'] },
    resourceId: { type: ['string', 'null'] },
    securityClassification: {
      type: ['string', 'null'],
      enum: ['public', 'protected a', 'protected b', 'protected c', '', null],
      default: 'protected a',
    },
    requiresAttention: { type: 'boolean' },
  },
  required: ['id', 'name'],
};

const commentSchema = {
  type: 'object',
  properties: {
    id: { type: 'integer' },
    createdBy: userSchema,
    createdOn: { type: 'string', format: 'date-time' },
    lastUpdatedBy: userSchema,
    lastUpdatedOn: { type: 'string', format: 'date-time' },
  },
};

export const TopicCreatedEventDefinition: DomainEventDefinition = {
  name: 'topic-created',
  description: 'Signalled when a topic is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      topic: topicSchema,
      createdBy: userSchema,
    },
  },
};

export const TopicUpdatedEventDefinition: DomainEventDefinition = {
  name: 'topic-updated',
  description: 'Signalled when a topic is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      topic: topicSchema,
      update: {
        type: 'object',
        properties: {
          name: { type: ['string', 'null'] },
          description: { type: ['string', 'null'] },
        },
      },
      updatedBy: userSchema,
    },
  },
};

export const TopicDeletedEventDefinition: DomainEventDefinition = {
  name: 'topic-deleted',
  description: 'Signalled when a topic is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      topic: topicSchema,
      deletedBy: userSchema,
    },
  },
};

export const CommentCreatedEventDefinition: DomainEventDefinition = {
  name: 'comment-created',
  description: 'Signalled when a comment is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      topic: topicSchema,
      comment: commentSchema,
      createdBy: userSchema,
    },
  },
};

export const CommentUpdatedEventDefinition: DomainEventDefinition = {
  name: 'comment-updated',
  description: 'Signalled when a comment is updated.',
  payloadSchema: {
    type: 'object',
    properties: {
      topic: topicSchema,
      comment: commentSchema,
      updatedBy: userSchema,
    },
  },
};

export const CommentDeletedEventDefinition: DomainEventDefinition = {
  name: 'comment-deleted',
  description: 'Signalled when a comment is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      topic: topicSchema,
      comment: commentSchema,
      deletedBy: userSchema,
    },
  },
};

function mapComment(comment: Comment) {
  return {
    id: comment.id,
    createdBy: comment.createdBy,
    createdOn: comment.createdOn.toISOString(),
    lastUpdatedBy: comment.lastUpdatedBy,
    lastUpdatedOn: comment.lastUpdatedOn.toISOString(),
  };
}

function getCorrelationId(topic: TopicResponse) {
  return topic.resourceId?.toString() || topic.urn;
}

export function topicCreated(apiId: AdspId, topic: Topic, createdBy: User): DomainEvent {
  const topicResponse = mapTopic(apiId, topic);
  return {
    tenantId: topic.tenantId,
    name: TopicCreatedEventDefinition.name,
    timestamp: new Date(),
    correlationId: getCorrelationId(topicResponse),
    context: {
      topicTypeId: topic.type?.id,
      topicId: topic.id,
    },
    payload: {
      topic: topicResponse,
      createdBy: {
        id: createdBy.id,
        name: createdBy.name,
      },
    },
  };
}

export function topicUpdated(apiId: AdspId, topic: Topic, updatedBy: User): DomainEvent {
  const topicResponse = mapTopic(apiId, topic);
  return {
    tenantId: topic.tenantId,
    name: TopicUpdatedEventDefinition.name,
    timestamp: new Date(),
    correlationId: getCorrelationId(topicResponse),
    context: {
      topicTypeId: topic.type?.id,
      topicId: topic.id,
    },
    payload: {
      topic: topicResponse,
      updatedBy: {
        id: updatedBy.id,
        name: updatedBy.name,
      },
    },
  };
}

export function topicDeleted(apiId: AdspId, topic: Topic, deletedBy: User): DomainEvent {
  const topicResponse = mapTopic(apiId, topic);
  return {
    tenantId: topic.tenantId,
    name: TopicDeletedEventDefinition.name,
    timestamp: new Date(),
    correlationId: getCorrelationId(topicResponse),
    context: {
      topicTypeId: topic.type?.id,
      topicId: topic.id,
    },
    payload: {
      topic: topicResponse,
      deletedBy: {
        id: deletedBy.id,
        name: deletedBy.name,
      },
    },
  };
}

export function commentCreated(apiId: AdspId, topic: Topic, comment: Comment): DomainEvent {
  const topicResponse = mapTopic(apiId, topic);
  return {
    tenantId: topic.tenantId,
    name: CommentCreatedEventDefinition.name,
    timestamp: comment.createdOn,
    correlationId: getCorrelationId(topicResponse),
    context: {
      topicTypeId: topic.type?.id,
      topicId: topic.id,
      commentId: comment.id,
    },
    payload: {
      topic: topicResponse,
      comment: mapComment(comment),
      createdBy: {
        id: comment.createdBy.id,
        name: comment.createdBy.name,
      },
    },
  };
}

export function commentUpdated(apiId: AdspId, topic: Topic, comment: Comment): DomainEvent {
  const topicResponse = mapTopic(apiId, topic);
  return {
    tenantId: topic.tenantId,
    name: CommentUpdatedEventDefinition.name,
    timestamp: comment.lastUpdatedOn,
    correlationId: getCorrelationId(topicResponse),
    context: {
      topicTypeId: topic.type?.id,
      topicId: topic.id,
      commentId: comment.id,
    },
    payload: {
      topic: topicResponse,
      comment: mapComment(comment),
      updatedBy: {
        id: comment.lastUpdatedBy.id,
        name: comment.lastUpdatedBy.name,
      },
    },
  };
}

export function commentDeleted(apiId: AdspId, topic: Topic, comment: Comment, deletedBy: User): DomainEvent {
  const topicResponse = mapTopic(apiId, topic);
  return {
    tenantId: topic.tenantId,
    name: CommentUpdatedEventDefinition.name,
    timestamp: new Date(),
    correlationId: getCorrelationId(topicResponse),
    context: {
      topicTypeId: topic.type?.id,
      topicId: topic.id,
      commentId: comment.id,
    },
    payload: {
      topic: topicResponse,
      comment: mapComment(comment),
      updatedBy: {
        id: deletedBy.id,
        name: deletedBy.name,
      },
    },
  };
}
