import { InvalidOperationError } from '@core-services/core-common';
import { Channel, NotificationType } from '../types';
import { toNotificationTypeDefinition, validateNotificationType } from './typeDefinition';

describe('typeDefinition', () => {
  const validType = (): NotificationType =>
    ({
      id: 'application-status',
      name: 'Application status',
      description: 'Status updates.',
      publicSubscribe: false,
      manageSubscribe: true,
      subscriberRoles: ['applicant'],
      channels: [Channel.email, Channel.sms],
      events: [
        {
          namespace: 'form-service',
          name: 'form-submitted',
          templates: {
            email: { subject: 'Submitted', body: '<p>Submitted</p>', title: 'Title' },
            sms: null,
          },
        },
      ],
    }) as unknown as NotificationType;

  const expectInvalid = (type: unknown, message: string) => {
    let error: Error;
    try {
      validateNotificationType(type as NotificationType);
    } catch (err) {
      error = err;
    }
    expect(error).toBeInstanceOf(InvalidOperationError);
    expect(error.message).toContain(message);
  };

  describe('validateNotificationType', () => {
    it('accepts a valid type', () => {
      expect(() => validateNotificationType(validType())).not.toThrow();
    });

    it('accepts a type without events', () => {
      expect(() => validateNotificationType({ ...validType(), events: [] })).not.toThrow();
    });

    it('accepts optional path fields', () => {
      expect(() =>
        validateNotificationType({ ...validType(), addressPath: 'email', bccPath: null } as NotificationType),
      ).not.toThrow();
    });

    it('rejects an invalid id', () => {
      expectInvalid({ ...validType(), id: 'not/valid' }, 'id must be');
    });

    it('rejects a reserved id', () => {
      expectInvalid({ ...validType(), id: 'contact' }, "id 'contact' is reserved");
    });

    it('rejects a missing name', () => {
      expectInvalid({ ...validType(), name: ' ' }, 'name is required');
    });

    it('rejects a non-string optional field', () => {
      expectInvalid({ ...validType(), addressPath: 5 }, 'addressPath must be a string');
    });

    it('rejects non-boolean subscribe settings', () => {
      expectInvalid({ ...validType(), publicSubscribe: 'yes' }, 'publicSubscribe must be a boolean');
      expectInvalid({ ...validType(), manageSubscribe: 'yes' }, 'manageSubscribe must be a boolean');
    });

    it('rejects invalid subscriber roles', () => {
      expectInvalid({ ...validType(), subscriberRoles: 'applicant' }, 'subscriberRoles must be');
    });

    it('rejects missing and unknown channels', () => {
      expectInvalid({ ...validType(), channels: [] }, 'channels must include at least one channel');
      expectInvalid({ ...validType(), channels: ['email', 'fax'] }, 'unknown channel(s): fax');
    });

    it('rejects events that are not an array', () => {
      expectInvalid({ ...validType(), events: {} }, 'events must be an array');
    });

    it('rejects an event without a valid namespace and name', () => {
      expectInvalid({ ...validType(), events: [{ namespace: 'a:b', name: 'c', templates: {} }] }, 'each event must');
    });

    it('rejects a duplicate event', () => {
      const event = validType().events[0];
      expectInvalid({ ...validType(), events: [event, event] }, "'form-service:form-submitted' is included more");
    });

    it('rejects an event without templates', () => {
      expectInvalid({ ...validType(), events: [{ namespace: 'a', name: 'b' }] }, "event 'a:b' must have templates");
    });

    it('rejects templates for unknown channels and templates without subject and body', () => {
      expectInvalid(
        { ...validType(), events: [{ namespace: 'a', name: 'b', templates: { fax: { subject: '', body: '' } } }] },
        "unknown channel 'fax'",
      );
      expectInvalid(
        { ...validType(), events: [{ namespace: 'a', name: 'b', templates: { email: { subject: 'x' } } }] },
        'email template must have a subject and body',
      );
    });
  });

  describe('toNotificationTypeDefinition', () => {
    it('keeps definition fields and drops others', () => {
      const type = {
        ...validType(),
        addressPath: 'email',
        sortedChannels: ['email'],
        events: [{ ...validType().events[0], customized: true }],
      } as unknown as NotificationType;

      const definition = toNotificationTypeDefinition(type);
      expect(definition).toEqual({
        ...validType(),
        addressPath: 'email',
      });
    });

    it('leaves invalid events for validation to reject', () => {
      const definition = toNotificationTypeDefinition({ ...validType(), events: null });
      expect(definition.events).toBeNull();
    });
  });
});
