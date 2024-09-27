import { AjvValidationService } from '@core-services/core-common';
import { Logger } from 'winston';
import {
  CalendarEventCreatedDefinition,
  CalendarEventUpdatedDefinition,
  CalendarEventDeletedDefinition,
} from './events';

describe('events', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  it('calendar-event-created is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', CalendarEventCreatedDefinition.payloadSchema);
  });

  it('calendar-event-updated is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', CalendarEventUpdatedDefinition.payloadSchema);
  });

  it('calendar-event-deleted is valid json schema', () => {
    const service = new AjvValidationService(logger as unknown as Logger);
    service.setSchema('payload', { $ref: 'http://json-schema.org/draft-07/schema#' });
    service.validate('test', 'payload', CalendarEventDeletedDefinition.payloadSchema);
  });
});
