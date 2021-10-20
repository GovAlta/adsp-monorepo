import { DomainEvent } from '@core-services/core-common';
import { DateTime } from 'luxon';
import { createTemplateService } from './handlebars';
import { Subscriber } from './notification';

describe('HandlebarsTemplateService', () => {
  it('can be created', () => {
    const templateService = createTemplateService();
    expect(templateService).toBeTruthy();
  });

  describe('generateMessage', () => {
    const templateService = createTemplateService();
    it('can generate message', () => {
      const message = templateService.generateMessage(
        {
          subject: '{{ subscriber.addressAs }} {{ event.payload.value }}',
          body: '{{ event.payload.value }} {{ subscriber.addressAs }}',
        },
        {
          event: { payload: { value: 123 } } as unknown as DomainEvent,
          subscriber: { addressAs: 'tester' } as Subscriber,
        }
      );

      expect(message.subject).toBe('tester 123');
      expect(message.body).toBe('123 tester');
    });

    it('can generate message with formatDate', () => {
      const timestamp = new Date('2020-03-12T13:00:00Z');
      const message = templateService.generateMessage(
        {
          subject: '{{ subscriber.addressAs }} {{ event.payload.value }}',
          body: '{{ formatDate event.timestamp }}',
        },
        {
          event: { timestamp, payload: { value: 123 } } as unknown as DomainEvent,
          subscriber: { addressAs: 'tester' } as Subscriber,
        }
      );

      expect(message.subject).toBe('tester 123');
      expect(message.body).toBe(DateTime.fromJSDate(timestamp).toFormat('ff'));
    });

    it('can generate message with formatDate with format parameter', () => {
      const timestamp = new Date('2020-03-12T13:00:00Z');
      const message = templateService.generateMessage(
        {
          subject: '{{ subscriber.addressAs }} {{ event.payload.value }}',
          body: '{{ formatDate event.timestamp format="fff" }}',
        },
        {
          event: { timestamp, payload: { value: 123 } } as unknown as DomainEvent,
          subscriber: { addressAs: 'tester' } as Subscriber,
        }
      );

      expect(message.subject).toBe('tester 123');
      expect(message.body).toBe(DateTime.fromJSDate(timestamp).toFormat('fff'));
    });
  });
});
