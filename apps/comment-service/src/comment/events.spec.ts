import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import {
  TopicCreatedEventDefinition,
  TopicUpdatedEventDefinition,
  TopicDeletedEventDefinition,
  CommentCreatedEventDefinition,
  CommentUpdatedEventDefinition,
  CommentDeletedEventDefinition,
} from './events';

describe('events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('topic-created is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', TopicCreatedEventDefinition.payloadSchema);
  });

  it('topic-updated is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', TopicUpdatedEventDefinition.payloadSchema);
  });

  it('topic-deleted is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', TopicDeletedEventDefinition.payloadSchema);
  });

  it('comment-created is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', CommentCreatedEventDefinition.payloadSchema);
  });

  it('comment-updated is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', CommentUpdatedEventDefinition.payloadSchema);
  });

  it('comment-deleted is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', CommentDeletedEventDefinition.payloadSchema);
  });
});
