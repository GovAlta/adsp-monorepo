import { adspId } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { NotificationConfiguration } from './configuration';
import { Channel } from '../types';

describe('NotificationConfiguration', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  it('can be created', () => {
    const configuration = new NotificationConfiguration({}, tenantId);
    expect(configuration).toBeTruthy();
  });

  describe('getNotificationType', () => {
    const type = {
      id: 'test',
      name: 'Test Type',
      description: '',
      publicSubscribe: true,
      subscriberRoles: [],
      channels: [Channel.email],
      events: [
        {
          namespace: 'test',
          name: 'test-run',
          templates: {
            [Channel.email]: { subject: '', body: '' },
            [Channel.sms]: null,
            [Channel.mail]: null,
          },
        },
      ],
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const configuration = new NotificationConfiguration({ contact: {} as any, test: type }, tenantId);

    it('can return type', () => {
      const entity = configuration.getNotificationType('test');
      expect(entity).toBeTruthy();
      expect(entity.name).toBe('Test Type');
    });

    it('can return falsy for contact', () => {
      const entity = configuration.getNotificationType('contact');
      expect(entity).toBeFalsy();
    });

    it('can return falsy for unknown', () => {
      const entity = configuration.getNotificationType('unknown');
      expect(entity).toBeFalsy();
    });
  });

  describe('getNotificationTypes', () => {
    const type = {
      id: 'test',
      name: 'Test Type',
      description: '',
      publicSubscribe: true,
      subscriberRoles: [],
      channels: [Channel.email],
      events: [
        {
          namespace: 'test',
          name: 'test-run',
          templates: {
            [Channel.email]: { subject: '', body: '' },
            [Channel.sms]: null,
            [Channel.mail]: null,
          },
        },
      ],
    };
    const configuration = new NotificationConfiguration({ test: type }, tenantId);

    it('can return types', () => {
      const entities = configuration.getNotificationTypes();
      expect(entities).toBeTruthy();
      expect(entities[0]).toBeTruthy();
      expect(entities[0].name).toBe('Test Type');
    });
  });

  describe('getEventNotificationTypes', () => {
    const type = {
      id: 'test',
      name: 'Test Type',
      description: '',
      publicSubscribe: true,
      subscriberRoles: [],
      channels: [Channel.email],
      events: [
        {
          namespace: 'test',
          name: 'test-run',
          templates: {
            [Channel.email]: { subject: '', body: '' },
            [Channel.sms]: null,
            [Channel.mail]: null,
          },
        },
      ],
    };
    const configuration = new NotificationConfiguration({ test: type }, tenantId);

    it('can return type for event', () => {
      const types = configuration.getEventNotificationTypes({ namespace: 'test', name: 'test-run' } as DomainEvent);
      expect(types).toBeTruthy();
      expect(types.length).toBe(1);
      expect(types[0].name).toBe('Test Type');
    });

    it('can return empty array for unknown', () => {
      const types = configuration.getEventNotificationTypes({ namespace: 'test', name: 'unknown' } as DomainEvent);
      expect(types).toBeTruthy();
      expect(types.length).toBe(0);
    });
  });
});
