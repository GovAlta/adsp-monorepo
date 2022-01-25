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
      expect(message.body).toBe(DateTime.fromJSDate(timestamp).setZone(zone).toFormat('ff ZZZZ'));
    });

    it('can generate message with formatDate for string value', () => {
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

    it('can generate message with formatDate with format parameter', () => {
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

    it('Can generate body message for plain text, expect no wrapper apply', () => {
      const message = templateService.generateMessage(
        {
          subject: 'Creating tenant ',
          body: 'tenant was create',
        },
        {
          event: { payload: { value: 123 } } as unknown as DomainEvent,
          subscriber: { addressAs: 'tester' } as Subscriber,
        }
      );

      expect(message.body).toBe('tenant was create');
    });

    it('Can generate body message for html snippet, wrapper applied', () => {
      const htmlSnippet = `
     <!doctype html>
     <html>
     <head>
     </head>
     <body>
     <p>Your draft {{ event.payload.name }} form has been created. </p></body>
     </html>`;
      const message = templateService.generateMessage(
        {
          subject: 'Creating tenant ',
          body: htmlSnippet,
        },
        {
          event: {
            payload: { name: 'event-service' },
          } as unknown as DomainEvent,
          name: 'test-created',
          namespace: 'test-service',
          subscriber: { addressAs: 'tester' } as Subscriber,
        }
      );
      expect(message.body).not.toContain('<header>');
      expect(message.body).not.toContain('<footer>');
      expect(message.body).toContain('event-service');
    });

    it('Wrapper not applied, when message body is complete html', () => {
      const htmlSnippet = `


     <p>Your draft {{ event.payload.name }} form has been created. </p>
     `;
      const message = templateService.generateMessage(
        {
          subject: 'Creating tenant ',
          body: htmlSnippet,
        },
        {
          event: {
            payload: { name: 'event-service' },
          } as unknown as DomainEvent,
          name: 'test-created',
          namespace: 'test-service',
          subscriber: { addressAs: 'tester' } as Subscriber,
        }
      );
      expect(message.body).toContain('<html>');
      expect(message.body).toContain('</html>');
      expect(message.body).toContain('test-created');
      expect(message.body).toContain('test-service');
    });
  });
});
