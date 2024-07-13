import { adspId, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { of } from 'rxjs';
import { Logger } from 'winston';
import { PushServiceRoles } from '../roles';
import { StreamEntity } from './stream';

const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
} as unknown as Logger;

describe('StreamEntity', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  let entity: StreamEntity;

  beforeEach(() => {
    entity = new StreamEntity(loggerMock, tenantId, {
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

  it('StreamEntity can be created', () => {
    const newEntity = new StreamEntity(loggerMock, tenantId, {
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
  it('should initialize events to an empty array if undefined', () => {
    const stream = {
      id: 'streamId',
      name: 'testStream',
      description: 'Test Stream',
      publicSubscribe: true,
      subscriberRoles: ['test-subscriber'],
      events: undefined,
    };

    const entity = new StreamEntity(loggerMock, tenantId, stream);

    expect(entity.events).toEqual([]);
  });
  it('should initialize subscriberRoles to an empty array if undefined', () => {
    const stream = {
      id: 'streamId',
      name: 'testStream',
      description: 'Test Stream',
      publicSubscribe: true,
      subscriberRoles: undefined,
      events: [],
    };

    const entity = new StreamEntity(loggerMock, tenantId, stream);

    expect(entity.subscriberRoles).toEqual([]);
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
      const publicEntity = new StreamEntity(loggerMock, tenantId, {
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

    it('can return false for cross-tenant non-core user', () => {
      const stream = new StreamEntity(loggerMock, null, {
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

      const result = stream.canSubscribe({ tenantId, id: 'tester', roles: ['test-subscriber'] } as User);
      expect(result).toBe(false);
    });

    it('can return true for cross-tenant core user with role', () => {
      const stream = new StreamEntity(loggerMock, null, {
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

      const result = stream.canSubscribe({ isCore: true, id: 'tester', roles: ['test-subscriber'] } as User);
      expect(result).toBe(true);
    });

    it('can return false for cross-tenant public stream', () => {
      const publicEntity = new StreamEntity(loggerMock, null, {
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
      expect(result).toBe(false);
    });
  });

  describe('connect', () => {
    it('can connect to events', () => {
      const result = entity.connect(
        of({
          tenantId,
          namespace: 'test-service',
          name: 'test-started',
          timestamp: new Date(),
          payload: {},
          traceparent: '123',
        })
      );

      expect(result).toBe(entity);
    });
  });

  describe('isMatch', () => {
    const stream = new StreamEntity(loggerMock, tenantId, {
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
        },
      ],
    });

    it('can return true for event matching criteria', () => {
      const result = stream.isMatch(
        {
          tenantId,
          namespace: 'test-service',
          name: 'test-started',
          correlationId: '123',
          context: { value: 123, other: 321 },
        },
        { correlationId: '123', context: { value: 123 } }
      );

      expect(result).toBe(true);
    });

    it('can return false for event not matching correlationId criteria', () => {
      const result = stream.isMatch(
        {
          tenantId,
          namespace: 'test-service',
          name: 'test-started',
          correlationId: '321',
          context: { value: 123, other: 321 },
        },
        { correlationId: '123', context: { value: 123 } }
      );

      expect(result).toBe(false);
    });
    it('can return false for event missing context', () => {
      const result = stream.isMatch(
        {
          tenantId,
          namespace: 'test-service',
          name: 'test-started',
          correlationId: '123',
        },
        { correlationId: '123', context: { value: 123 } }
      );

      expect(result).toBe(false);
    });
    it('can return false for event not matching context criteria', () => {
      const result = stream.isMatch(
        {
          tenantId,
          namespace: 'test-service',
          name: 'test-started',
          correlationId: '321',
          context: { value: 123, other: 321 },
        },
        { correlationId: '123', context: { value: 321 } }
      );

      expect(result).toBe(false);
    });
  });

  describe('getEvents', () => {
    it('can get events', (done) => {
      const stream = new StreamEntity(loggerMock, tenantId, {
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
              traceparent: '123',
            },
            {
              tenantId,
              namespace: 'test-service',
              name: 'test-started',
              timestamp: new Date(),
              correlationId: '123',
              context: { value: 123, other: '234' },
              payload: {},
              traceparent: '123',
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
