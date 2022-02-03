import { DomainEvent } from '@core-services/core-common';
import { DateTime } from 'luxon';
import { createTemplateService } from './handlebars';
import { Subscriber } from './notification';

describe('HandlebarsTemplateService', () => {
  const zone = 'America/Edmonton';
  it('can be created', () => {
    const templateService = createTemplateService();
    expect(templateService).toBeTruthy();
  });

  describe('generateMessage', () => {
    const templateService = createTemplateService();
    it('can generate message, with wrapper applied', () => {
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
    });

    it('can generate message with formatDate, with wrapper applied', () => {
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
      expect(message.body).toBe(DateTime.fromJSDate(timestamp).setZone(zone).toFormat('ff ZZZZ'));
    });

    it('can generate message with formatDate for string value, with wrapper applied', () => {
      const timestamp = '2020-03-12T13:00:00Z';
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
      expect(message.body).toBe(DateTime.fromISO(timestamp).setZone(zone).toFormat('ff ZZZZ'));
    });

    it('can generate message with formatDate with format parameter, with wrapper applied', () => {
      const timestamp = new Date('2020-03-12T13:00:00Z');
      const message = templateService.generateMessage(
        {
          subject: '{{ subscriber.addressAs }} {{ event.payload.value }}',
          body: '{{ formatDate event.timestamp format="fff ZZZZ" }}',
        },
        {
          event: { timestamp, payload: { value: 123 } } as unknown as DomainEvent,
          subscriber: { addressAs: 'tester' } as Subscriber,
        }
      );

      expect(message.subject).toBe('tester 123');
      expect(message.body).toBe(DateTime.fromJSDate(timestamp).setZone(zone).toFormat('fff ZZZZ'));
    });
  });
});
