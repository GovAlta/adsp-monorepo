import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { of } from 'rxjs';
import { PushServiceRoles } from '../roles';
import { StreamEntity } from './stream';

describe('StreamEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  let entity: StreamEntity;

  beforeEach(() => {
    entity = new StreamEntity(tenantId, {
      id: 'test',
      name: 'Test Stream',
      description: null,
      subscriberRoles: ['test-subscriber'],
      publicSubscribe: false,
      events: [
        {
          namespace: 'test-service',
          name: 'test-started',
        },
      ],
    });
  });

  it('can be created', () => {
    const newEntity = new StreamEntity(tenantId, {
      id: 'test',
      name: 'Test Stream',
      description: null,
      subscriberRoles: ['test-subscriber'],
      publicSubscribe: false,
      events: [
        {
          namespace: 'test-service',
          name: 'test-started',
        },
      ],
    });
    expect(newEntity).toBeTruthy();
  });

  describe('canSubscribe', () => {
    it('can return true for user with subscriber role', () => {
      const result = entity.canSubscribe({ tenantId, id: 'tester', roles: ['test-subscriber'] } as User);
      expect(result).toBe(true);
    });

    it('can return true for stream listener', () => {
      const result = entity.canSubscribe({ tenantId, id: 'tester', roles: [PushServiceRoles.StreamListener] } as User);
      expect(result).toBe(true);
    });

    it('can return false for user without role', () => {
      const result = entity.canSubscribe({ tenantId, id: 'tester', roles: [] } as User);
      expect(result).toBe(false);
    });

    it('can return true for core user', () => {
      const result = entity.canSubscribe({
        isCore: true,
        id: 'tester',
        roles: [PushServiceRoles.StreamListener],
      } as User);
      expect(result).toBe(true);
    });

    it('can return true for public stream', () => {
      const publicEntity = new StreamEntity(tenantId, {
        id: 'test',
        name: 'Test Stream',
        description: null,
        subscriberRoles: ['test-subscriber'],
        publicSubscribe: true,
        events: [
          {
            namespace: 'test-service',
            name: 'test-started',
          },
        ],
      });
      const result = publicEntity.canSubscribe(null);
      expect(result).toBe(true);
    });
  });

  describe('connect', () => {
    it('can connect to events', () => {
      const result = entity.connect(
        of({ tenantId, namespace: 'test-service', name: 'test-started', timestamp: new Date(), payload: {} })
      );

      expect(result).toBe(entity);
    });
  });

  describe('getEvents', () => {
    it('can get events', (done) => {
      const stream = new StreamEntity(tenantId, {
        id: 'test',
        name: 'Test Stream',
        description: null,
        subscriberRoles: ['test-subscriber'],
        publicSubscribe: false,
        events: [
          {
            namespace: 'test-service',
            name: 'test-started',
            criteria: {
              correlationId: '123',
              context: { value: 123 },
            },
            map: {
              namespace: 'namespace',
              name: 'name',
              correlationId: 'correlationId',
            },
          },
        ],
      });

      const result = stream
        .connect(
          of(
            {
              tenantId,
              namespace: 'test-service',
              name: 'test-started',
              timestamp: new Date(),
              correlationId: '321',
              payload: {},
            },
            {
              tenantId,
              namespace: 'test-service',
              name: 'test-started',
              timestamp: new Date(),
              correlationId: '123',
              context: { value: 123 },
              payload: {},
            }
          )
        )
        .getEvents({ tenantId, id: 'tester', roles: ['test-subscriber'] } as User);

      result.subscribe({
        next: (next) => {
          expect(next).toMatchObject({
            namespace: 'test-service',
            name: 'test-started',
            correlationId: '123',
          });
        },
        error: (err) => done(err),
        complete: done,
      });
    });

    it('can throw for not connected', () => {
      expect(() => entity.getEvents({ tenantId, id: 'tester', roles: ['test-subscriber'] } as User)).toThrowError(
        InvalidOperationError
      );
    });

    it('can throw for unauthorized user', () => {
      expect(() => entity.getEvents({ tenantId, id: 'tester', roles: [] } as User)).toThrowError(UnauthorizedUserError);
    });
  });
});
