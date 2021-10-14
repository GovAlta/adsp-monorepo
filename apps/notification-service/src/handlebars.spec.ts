import { DomainEvent } from '@core-services/core-common';
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
        { payload: { value: 123 } } as unknown as DomainEvent,
        { addressAs: 'tester' } as Subscriber
      );

      expect(message.subject).toBe('tester 123');
      expect(message.body).toBe('123 tester');
    });

    it('can generate message with formatDate', () => {
      const message = templateService.generateMessage(
        {
          subject: '{{ subscriber.addressAs }} {{ event.payload.value }}',
          body: '{{ formatDate event.timestamp }}',
        },
        { timestamp: new Date('2020-03-12T13:00:00Z'), payload: { value: 123 } } as unknown as DomainEvent,
        { addressAs: 'tester' } as Subscriber
      );

      expect(message.subject).toBe('tester 123');
      expect(message.body).toBe('Mar 12, 2020, 7:00 AM');
    });

    it('can generate message with formatDate with format parameter', () => {
      const message = templateService.generateMessage(
        {
          subject: '{{ subscriber.addressAs }} {{ event.payload.value }}',
          body: '{{ formatDate event.timestamp format="fff" }}',
        },
        { timestamp: new Date('2020-03-12T13:00:00Z'), payload: { value: 123 } } as unknown as DomainEvent,
        { addressAs: 'tester' } as Subscriber
      );

      expect(message.subject).toBe('tester 123');
      expect(message.body).toBe('March 12, 2020, 7:00 AM MDT');
    });
  });
});
