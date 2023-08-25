import { DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { Comment, Topic } from './types';

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

function mapTopic(topic: Topic) {
  return {
    typeId: topic.type.id,
    id: topic.id,
    name: topic.name,
    description: topic.description,
    resourceId: topic.resourceId?.toString(),
    commenters: topic.commenters,
  };
}

function mapComment(comment: Comment) {
  return {
    id: comment.id,
    createdBy: comment.createdBy,
    createdOn: comment.createdOn.toISOString(),
    lastUpdatedBy: comment.lastUpdatedBy,
    lastUpdatedOn: comment.lastUpdatedOn.toISOString(),
  };
}

export function topicCreated(topic: Topic, createdBy: User): DomainEvent {
  return {
    tenantId: topic.tenantId,
    name: TopicCreatedEventDefinition.name,
    timestamp: new Date(),
    correlationId: `topic-${topic.id}`,
    context: {
      topicId: topic.id,
    },
    payload: {
      topic: mapTopic(topic),
      createdBy: {
        id: createdBy.id,
        name: createdBy.name,
      },
    },
  };
}

export function topicUpdated(topic: Topic, updatedBy: User): DomainEvent {
  return {
    tenantId: topic.tenantId,
    name: TopicUpdatedEventDefinition.name,
    timestamp: new Date(),
    correlationId: `topic-${topic.id}`,
    context: {
      topicId: topic.id,
    },
    payload: {
      topic: mapTopic(topic),
      updatedBy: {
        id: updatedBy.id,
        name: updatedBy.name,
      },
    },
  };
}

export function topicDeleted(topic: Topic, deletedBy: User): DomainEvent {
  return {
    tenantId: topic.tenantId,
    name: TopicDeletedEventDefinition.name,
    timestamp: new Date(),
    correlationId: `topic-${topic.id}`,
    context: {
      topicId: topic.id,
    },
    payload: {
      topic: mapTopic(topic),
      deletedBy: {
        id: deletedBy.id,
        name: deletedBy.name,
      },
    },
  };
}

export function commentCreated(topic: Topic, comment: Comment): DomainEvent {
  return {
    tenantId: topic.tenantId,
    name: CommentCreatedEventDefinition.name,
    timestamp: comment.createdOn,
    correlationId: `topic-${topic.id}:${comment.id}`,
    context: {
      topicId: topic.id,
      commentId: comment.id,
    },
    payload: {
      topic: mapTopic(topic),
      comment: mapComment(comment),
      createdBy: {
        id: comment.createdBy.id,
        name: comment.createdBy.name,
      },
    },
  };
}

export function commentUpdated(topic: Topic, comment: Comment): DomainEvent {
  return {
    tenantId: topic.tenantId,
    name: CommentUpdatedEventDefinition.name,
    timestamp: comment.lastUpdatedOn,
    correlationId: `topic-${topic.id}:${comment.id}`,
    context: {
      topicId: topic.id,
      commentId: comment.id,
    },
    payload: {
      topic: mapTopic(topic),
      comment: mapComment(comment),
      updatedBy: {
        id: comment.lastUpdatedBy.id,
        name: comment.lastUpdatedBy.name,
      },
    },
  };
}

export function commentDeleted(topic: Topic, comment: Comment, deletedBy: User): DomainEvent {
  return {
    tenantId: topic.tenantId,
    name: CommentUpdatedEventDefinition.name,
    timestamp: new Date(),
    correlationId: `topic-${topic.id}:${comment.id}`,
    context: {
      topicId: topic.id,
      commentId: comment.id,
    },
    payload: {
      topic: mapTopic(topic),
      comment: mapComment(comment),
      updatedBy: {
        id: deletedBy.id,
        name: deletedBy.name,
      },
    },
  };
}
