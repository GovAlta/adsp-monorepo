import { adspId, User } from '@abgov/adsp-service-sdk';
import { ServiceUserRoles, Subscriber } from '../types';
import { NotificationTypeEntity } from './type';

describe('NotificationTypeEntity', () => {
  it('can be created', () => {
    const entity = new NotificationTypeEntity(
      {
        id: 'test-type',
        name: 'test type',
        description: null,
        subscriberRoles: [],
        events: [],
      },
      adspId`urn:ads:platform:tenant-service:v2:/tenants/test`
    );

    expect(entity).toBeTruthy();
  });

  describe('canSubscribe', () => {
    it('can return false for null user', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(entity.canSubscribe(null, null)).toBe(false);
    });

    it('can return false for user of wrong tenant', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(
        entity.canSubscribe(
          {
            id: 'test',
            tenantId: adspId`urn:ads:platform:tenant-service:v2:/tenants/different`,
            roles: [],
          } as User,
          {} as Subscriber
        )
      ).toBe(false);
    });

    it('can return false for user without role', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          subscriberRoles: ['staff'],
          events: [],
        },
        tenantId
      );

      expect(entity.canSubscribe({ id: 'test', tenantId, roles: [] } as User, { userId: 'test' } as Subscriber)).toBe(
        false
      );
    });

    it('can return true for user with role', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          subscriberRoles: ['staff'],
          events: [],
        },
        tenantId
      );

      expect(
        entity.canSubscribe({ id: 'test', tenantId, roles: ['staff'] } as User, { userId: 'test' } as Subscriber)
      ).toBe(true);
    });

    it('can return true for type without required roles', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(entity.canSubscribe({ id: 'test', tenantId, roles: [] } as User, { userId: 'test' } as Subscriber)).toBe(
        true
      );
    });

    it('can return false for user subscribing for another user', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          subscriberRoles: ['staff'],
          events: [],
        },
        tenantId
      );

      expect(
        entity.canSubscribe({ id: 'test', tenantId, roles: ['staff'] } as User, { userId: 'another' } as Subscriber)
      ).toBe(false);
    });

    it('can return true for user with subscription admin role', () => {
      const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
      const entity = new NotificationTypeEntity(
        {
          id: 'test-type',
          name: 'test type',
          description: null,
          subscriberRoles: [],
          events: [],
        },
        tenantId
      );

      expect(
        entity.canSubscribe(
          { id: 'test', tenantId, roles: [ServiceUserRoles.SubscriptionAdmin] } as User,
          { userId: 'another' } as Subscriber
        )
      ).toBe(true);
    });
  });
});
