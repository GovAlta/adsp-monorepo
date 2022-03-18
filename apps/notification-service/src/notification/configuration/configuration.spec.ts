import { adspId } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { NotificationConfiguration } from './configuration';
import { Channel } from '../types';

describe('NotificationConfiguration', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

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

  const baseType = {
    id: 'base',
    name: 'Base Type',
    description: '',
    publicSubscribe: true,
    subscriberRoles: [],
    channels: [Channel.email],
    events: [
      {
        namespace: 'test',
        name: 'test-complete',
        templates: {
          [Channel.email]: { subject: '', body: '' },
          [Channel.sms]: null,
          [Channel.mail]: null,
        },
      },
    ],
  };

  const baseOverride = {
    id: 'base',
    name: 'Base Type',
    description: '',
    publicSubscribe: true,
    subscriberRoles: [],
    channels: [Channel.email],
    events: [
      {
        namespace: 'test',
        name: 'test-complete',
        templates: {
          [Channel.email]: { subject: 'This is tenant subject.', body: 'This is tenant body.' },
          [Channel.sms]: null,
          [Channel.mail]: null,
        },
      },
    ],
  };

  it('can be created', () => {
    const configuration = new NotificationConfiguration({}, {}, tenantId);
    expect(configuration).toBeTruthy();
  });

  describe('getNotificationType', () => {
    const configuration = new NotificationConfiguration(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { contact: {} as any, test: type },
      { base: baseType },
      tenantId
    );

    it('can return type', () => {
      const entity = configuration.getNotificationType('test');
      expect(entity).toBeTruthy();
      expect(entity.name).toBe('Test Type');
    });

    it('can return overridden type', () => {
      const entity = configuration.getNotificationType('base');
      expect(entity).toBeTruthy();
      expect(entity).toEqual(
        expect.objectContaining({
          name: 'Base Type',
          events: expect.arrayContaining([
            expect.objectContaining({
              templates: expect.objectContaining({
                [Channel.email]: expect.objectContaining({
                  subject: 'This is tenant subject.',
                  body: 'This is tenant body.',
                }),
              }),
            }),
          ]),
        })
      );
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
    const configuration = new NotificationConfiguration(
      { base: baseOverride, test: type },
      { base: baseType },
      tenantId
    );

    it('can return types', () => {
      const entities = configuration.getNotificationTypes();
      expect(entities).toBeTruthy();

      expect(entities).toContainEqual(expect.objectContaining({ name: 'Test Type' }));
      expect(entities).toContainEqual(
        expect.objectContaining({
          name: 'Base Type',
          events: expect.arrayContaining([
            expect.objectContaining({
              templates: expect.objectContaining({
                [Channel.email]: expect.objectContaining({
                  subject: 'This is tenant subject.',
                  body: 'This is tenant body.',
                }),
              }),
            }),
          ]),
        })
      );
    });
  });

  describe('getEventNotificationTypes', () => {
    const configuration = new NotificationConfiguration(
      { base: baseOverride, test: type },
      { base: baseType },
      tenantId
    );

    it('can return type for event', () => {
      const types = configuration.getEventNotificationTypes({ namespace: 'test', name: 'test-run' } as DomainEvent);
      expect(types).toBeTruthy();
      expect(types.length).toBe(1);
      expect(types[0].name).toBe('Test Type');
    });

    it('can return type for event', () => {
      const types = configuration.getEventNotificationTypes({
        namespace: 'test',
        name: 'test-complete',
      } as DomainEvent);
      expect(types).toBeTruthy();
      expect(types.length).toBe(1);
      expect(types[0].name).toBe('Base Type');
    });

    it('can return empty array for unknown', () => {
      const types = configuration.getEventNotificationTypes({ namespace: 'test', name: 'unknown' } as DomainEvent);
      expect(types).toBeTruthy();
      expect(types.length).toBe(0);
    });
  });
});
