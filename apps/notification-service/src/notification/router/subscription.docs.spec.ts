import { adspId, Channel, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler, createErrorHandler } from '@core-services/core-common';
import { createDocumentedResponseRecorder } from '@core-services/core-common/testing';
import * as express from 'express';
import { Express } from 'express';
import { join } from 'path';
import * as request from 'supertest';
import { Logger } from 'winston';
import { NotificationTypeEntity, SubscriberEntity, SubscriptionEntity } from '../model';
import { ServiceUserRoles } from '../types';
import { createSubscriptionRouter } from './subscription';

// Verifies the request validation, roles, and error responses documented in subscription.swagger.yml by sending
// requests through the router as mounted in the service (authenticated, then the router, then the error handler).
describe('subscription router documented behaviour', () => {
  const serviceId = adspId`urn:ads:platform:notification-service`;
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const documented = createDocumentedResponseRecorder(join(__dirname, 'subscription.swagger.yml'));

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    getSubscriber: jest.fn(),
    getSubscription: jest.fn(),
    getSubscriptions: jest.fn(),
    findSubscribers: jest.fn(),
    saveSubscriber: jest.fn(),
    saveSubscription: jest.fn(),
    deleteSubscriptions: jest.fn(),
    deleteSubscriber: jest.fn(),
  };
  const eventServiceMock = { send: jest.fn() };
  const verifyServiceMock = { sendCode: jest.fn(), sendCodeWithLink: jest.fn(), verifyCode: jest.fn() };

  const applicantSubscriberId = '64f1c2a3b4c5d6e7f8a9b0c1';
  const otherSubscriberId = '64f1c2a3b4c5d6e7f8a9b0c2';
  const unknownSubscriberId = '64f1c2a3b4c5d6e7f8a9b0c3';

  const user = (id: string, roles: string[], overrides: Partial<User> = {}) =>
    ({ id, name: id, email: `${id}@test.co`, tenantId, isCore: false, roles, ...overrides }) as User;
  const admin = user('admin', [ServiceUserRoles.SubscriptionAdmin]);
  const app = user('app', [ServiceUserRoles.SubscriptionApp]);
  const applicant = user('applicant-user', ['applicant']);
  const plain = user('plain-user', []);
  const codeSender = user('sender', [ServiceUserRoles.CodeSender]);

  const type = (id: string, settings: Partial<NotificationTypeEntity>) =>
    new NotificationTypeEntity(
      loggerMock,
      null,
      null,
      {
        id,
        name: id,
        description: null,
        publicSubscribe: false,
        manageSubscribe: false,
        subscriberRoles: [],
        channels: [Channel.email],
        events: [],
        ...settings,
      } as never,
      tenantId,
    );
  const types = {
    'admin-only': type('admin-only', {}),
    'self-service': type('self-service', { manageSubscribe: true, subscriberRoles: ['applicant'] }),
    'public-type': type('public-type', { manageSubscribe: true, publicSubscribe: true }),
  };
  const configuration = {
    getNotificationTypes: () => Object.values(types),
    getNotificationType: (id: string) => types[id],
  };

  let subscribers: Record<string, SubscriberEntity>;
  let subscriptions: SubscriptionEntity[];

  function createApp(currentUser: User | null): Express {
    const server = express();
    server.use(documented.middleware);
    server.use(express.json());
    server.use((req, _res, next) => {
      req.user = currentUser;
      req.isAuthenticated = (() => !!currentUser) as typeof req.isAuthenticated;
      req.tenant = { id: tenantId } as typeof req.tenant;
      req.getConfiguration = jest.fn().mockResolvedValue(configuration);
      next();
    });
    server.use(
      '/subscription/v1',
      assertAuthenticatedHandler,
      createSubscriptionRouter({
        serviceId,
        logger: loggerMock,
        subscriptionRepository: repositoryMock as never,
        eventService: eventServiceMock,
        verifyService: verifyServiceMock as never,
        tenantService: null,
      }),
    );
    server.use(createErrorHandler(loggerMock));
    return server;
  }

  afterEach(async () => {
    await documented.assertDocumented();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    const subscriber = (id: string, userId: string) =>
      new SubscriberEntity(repositoryMock as never, {
        id,
        tenantId,
        userId,
        addressAs: userId,
        channels: [{ channel: Channel.email, address: `${userId}@test.co`, verified: false }],
      });
    subscribers = {
      [applicantSubscriberId]: subscriber(applicantSubscriberId, applicant.id),
      [otherSubscriberId]: subscriber(otherSubscriberId, 'someone-else'),
    };
    subscriptions = [];

    repositoryMock.getSubscriber.mockImplementation((_tenantId, id: string, byUserId: boolean) =>
      Promise.resolve(
        byUserId ? Object.values(subscribers).find((s) => s.userId === id) || null : subscribers[id] || null,
      ),
    );
    repositoryMock.getSubscription.mockImplementation((type: NotificationTypeEntity, subscriberId: string) =>
      Promise.resolve(subscriptions.find((s) => s.typeId === type.id && s.subscriberId === subscriberId) || null),
    );
    repositoryMock.getSubscriptions.mockResolvedValue({ results: [], page: { size: 0 } });
    repositoryMock.findSubscribers.mockResolvedValue({ results: [], page: { size: 0 } });
    repositoryMock.saveSubscriber.mockImplementation((entity: SubscriberEntity) => {
      entity.id = entity.id || unknownSubscriberId;
      return Promise.resolve(entity);
    });
    repositoryMock.saveSubscription.mockImplementation((entity) => Promise.resolve(entity));
    repositoryMock.deleteSubscriptions.mockResolvedValue(true);
    repositoryMock.deleteSubscriber.mockResolvedValue(true);
    verifyServiceMock.sendCode.mockResolvedValue('key');
    verifyServiceMock.verifyCode.mockResolvedValue(true);
  });

  const subscribe = (typeId: string, subscriberId: string, criteria = {}) =>
    subscriptions.push(
      new SubscriptionEntity(
        repositoryMock as never,
        { tenantId, typeId, subscriberId, criteria },
        types[typeId],
        subscribers[subscriberId],
      ),
    );

  it('responds 401 when there is no authenticated user', async () => {
    const res = await request(createApp(null)).get('/subscription/v1/types');
    expect(res.status).toBe(401);
  });

  describe('GET /types and /types/:type', () => {
    it('lists types to any authenticated user', async () => {
      const res = await request(createApp(plain)).get('/subscription/v1/types');
      expect(res.status).toBe(200);
      expect(res.body.map(({ id }) => id)).toEqual(['admin-only', 'self-service', 'public-type']);
    });

    it('gets a type for any authenticated user', async () => {
      const res = await request(createApp(plain)).get('/subscription/v1/types/self-service');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 'self-service', manageSubscribe: true, subscriberRoles: ['applicant'] });
    });

    it('responds 404 for an unknown type', async () => {
      const res = await request(createApp(plain)).get('/subscription/v1/types/unknown');
      expect(res.status).toBe(404);
    });

    it('responds 400 for a type ID longer than 50 characters', async () => {
      const res = await request(createApp(plain)).get(`/subscription/v1/types/${'a'.repeat(51)}`);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /types/:type/subscriptions', () => {
    it.each([
      ['subscription-admin', admin],
      ['subscription-app', app],
    ])('allows the %s role and defaults top to 10', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get('/subscription/v1/types/admin-only/subscriptions');
      expect(res.status).toBe(200);
      expect(repositoryMock.getSubscriptions).toHaveBeenCalledWith(
        configuration,
        tenantId,
        10,
        undefined,
        expect.objectContaining({ typeIdEquals: 'admin-only' }),
      );
    });

    it('responds 403 without the subscription-admin or subscription-app role', async () => {
      const res = await request(createApp(applicant)).get('/subscription/v1/types/self-service/subscriptions');
      expect(res.status).toBe(403);
    });

    it.each(['0', '5001'])('responds 400 for top=%s', async (top) => {
      const res = await request(createApp(admin)).get(`/subscription/v1/types/admin-only/subscriptions?top=${top}`);
      expect(res.status).toBe(400);
    });

    it('responds 400 for subscriberCriteria that is not JSON', async () => {
      const res = await request(createApp(admin)).get(
        '/subscription/v1/types/admin-only/subscriptions?subscriberCriteria=not-json',
      );
      expect(res.status).toBe(400);
    });

    it('responds 404 for an unknown type', async () => {
      const res = await request(createApp(admin)).get('/subscription/v1/types/unknown/subscriptions');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /types/:type/subscriptions', () => {
    it('allows subscription-admin to subscribe any subscriber', async () => {
      const res = await request(createApp(admin))
        .post('/subscription/v1/types/admin-only/subscriptions')
        .send({ id: otherSubscriberId, criteria: { correlationId: 'form-1' } });
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ typeId: 'admin-only', subscriberId: otherSubscriberId });
    });

    it('allows a user with a subscriber role to subscribe themselves with userSub', async () => {
      const res = await request(createApp(applicant)).post(
        '/subscription/v1/types/self-service/subscriptions?userSub=true',
      );
      expect(res.status).toBe(200);
      expect(res.body.subscriberId).toBe(applicantSubscriberId);
    });

    it('creates a subscriber from the user token with userSub and only uses criteria from the body', async () => {
      const res = await request(createApp(plain))
        .post('/subscription/v1/types/public-type/subscriptions?userSub=true')
        .send({ addressAs: 'Ignored', criteria: { correlationId: 'form-1' } });
      expect(res.status).toBe(200);
      expect(res.body.subscriber).toMatchObject({
        userId: plain.id,
        addressAs: plain.name,
        channels: [expect.objectContaining({ channel: Channel.email, address: plain.email })],
      });
      expect(res.body.criteria).toEqual([expect.objectContaining({ correlationId: 'form-1' })]);
    });

    it('rejects a user without a subscriber role when the type is not public', async () => {
      const res = await request(createApp(plain)).post(
        '/subscription/v1/types/self-service/subscriptions?userSub=true',
      );
      expect(res.status).toBe(401);
    });

    it('rejects a user subscribing themselves when the type does not allow users to manage their subscription', async () => {
      const res = await request(createApp(applicant)).post(
        '/subscription/v1/types/admin-only/subscriptions?userSub=true',
      );
      expect(res.status).toBe(401);
    });

    it('rejects a user subscribing another subscriber', async () => {
      const res = await request(createApp(applicant))
        .post('/subscription/v1/types/self-service/subscriptions')
        .send({ id: otherSubscriberId });
      expect(res.status).toBe(401);
    });

    it('responds 400 for a userSub that is not boolean', async () => {
      const res = await request(createApp(admin)).post('/subscription/v1/types/admin-only/subscriptions?userSub=yes');
      expect(res.status).toBe(400);
    });

    it('responds 400 for an id that is not a subscriber ID', async () => {
      const res = await request(createApp(admin))
        .post('/subscription/v1/types/admin-only/subscriptions')
        .send({ id: 'not-an-id' });
      expect(res.status).toBe(400);
    });

    it('responds 404 for an unknown type', async () => {
      const res = await request(createApp(admin))
        .post('/subscription/v1/types/unknown/subscriptions')
        .send({ id: otherSubscriberId });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /types/:type/subscriptions/:subscriber', () => {
    it('allows subscription-admin', async () => {
      subscribe('admin-only', otherSubscriberId);
      const res = await request(createApp(admin)).get(
        `/subscription/v1/types/admin-only/subscriptions/${otherSubscriberId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body.subscriberId).toBe(otherSubscriberId);
    });

    it('responds 403 for subscription-app', async () => {
      const res = await request(createApp(app)).get(
        `/subscription/v1/types/admin-only/subscriptions/${otherSubscriberId}`,
      );
      expect(res.status).toBe(403);
    });

    it('responds 400 for a subscriber that is not a subscriber ID', async () => {
      const res = await request(createApp(admin)).get('/subscription/v1/types/admin-only/subscriptions/not-an-id');
      expect(res.status).toBe(400);
      expect(res.body.errorMessage).toBe('Validation failed with error(s): subscriber (params) - Invalid value');
    });
  });

  describe('POST /types/:type/subscriptions/:subscriber', () => {
    it('creates a subscription with a single criteria object', async () => {
      const res = await request(createApp(admin))
        .post(`/subscription/v1/types/admin-only/subscriptions/${otherSubscriberId}`)
        .send({ criteria: { correlationId: 'form-1' } });
      expect(res.status).toBe(200);
    });

    it('replaces the criteria of an existing subscription with an array', async () => {
      subscribe('admin-only', otherSubscriberId);
      const res = await request(createApp(admin))
        .post(`/subscription/v1/types/admin-only/subscriptions/${otherSubscriberId}`)
        .send({ criteria: [{ correlationId: 'form-1' }, { correlationId: 'form-2' }] });
      expect(res.status).toBe(200);
      expect(res.body.criteria).toHaveLength(2);
    });

    it('responds 400 when creating a new subscription with an array of criteria', async () => {
      const res = await request(createApp(admin))
        .post(`/subscription/v1/types/admin-only/subscriptions/${otherSubscriberId}`)
        .send({ criteria: [{ correlationId: 'form-1' }] });
      expect(res.status).toBe(400);
    });

    it('responds 400 when criteria is missing', async () => {
      const res = await request(createApp(admin))
        .post(`/subscription/v1/types/admin-only/subscriptions/${otherSubscriberId}`)
        .send({});
      expect(res.status).toBe(400);
    });

    it('responds 404 for an unknown subscriber', async () => {
      const res = await request(createApp(admin))
        .post(`/subscription/v1/types/admin-only/subscriptions/${unknownSubscriberId}`)
        .send({ criteria: {} });
      expect(res.status).toBe(404);
    });

    it('responds 403 when updating a subscription the user is not permitted to change', async () => {
      subscribe('admin-only', otherSubscriberId);
      const res = await request(createApp(applicant))
        .post(`/subscription/v1/types/admin-only/subscriptions/${otherSubscriberId}`)
        .send({ criteria: {} });
      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /types/:type/subscriptions/:subscriber', () => {
    it('allows a user to unsubscribe themselves from a self-service type', async () => {
      const res = await request(createApp(applicant)).delete(
        `/subscription/v1/types/self-service/subscriptions/${applicantSubscriberId}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('rejects a user unsubscribing another subscriber', async () => {
      const res = await request(createApp(applicant)).delete(
        `/subscription/v1/types/self-service/subscriptions/${otherSubscriberId}`,
      );
      expect(res.status).toBe(401);
      expect(repositoryMock.deleteSubscriptions).not.toHaveBeenCalled();
    });
  });

  describe('DELETE /types/:type/subscriptions/:subscriber/criteria', () => {
    it('removes matching criteria with the same permissions as subscribing', async () => {
      subscribe('self-service', applicantSubscriberId, [{ correlationId: 'form-1' }, { correlationId: 'form-2' }]);
      const criteria = encodeURIComponent(JSON.stringify({ correlationId: 'form-1' }));
      const res = await request(createApp(applicant)).delete(
        `/subscription/v1/types/self-service/subscriptions/${applicantSubscriberId}/criteria?criteria=${criteria}`,
      );
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ deleted: true });
    });

    it('responds 403 for a user not permitted to change the subscription', async () => {
      subscribe('self-service', otherSubscriberId, [{ correlationId: 'form-1' }]);
      const criteria = encodeURIComponent(JSON.stringify({ correlationId: 'form-1' }));
      const res = await request(createApp(applicant)).delete(
        `/subscription/v1/types/self-service/subscriptions/${otherSubscriberId}/criteria?criteria=${criteria}`,
      );
      expect(res.status).toBe(403);
    });
  });

  describe('GET /subscribers', () => {
    it('allows subscription-admin and defaults top to 10', async () => {
      const res = await request(createApp(admin)).get('/subscription/v1/subscribers');
      expect(res.status).toBe(200);
      expect(repositoryMock.findSubscribers).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId }),
        undefined,
      );
    });

    it('responds 403 for subscription-app', async () => {
      const res = await request(createApp(app)).get('/subscription/v1/subscribers');
      expect(res.status).toBe(403);
    });

    it.each([['top=0'], ['top=5001'], ['sortBy=unknown'], ['sortBy=addressAs&sortDirection=sideways']])(
      'responds 400 for %s',
      async (query) => {
        const res = await request(createApp(admin)).get(`/subscription/v1/subscribers?${query}`);
        expect(res.status).toBe(400);
      },
    );
  });

  describe('POST /subscribers', () => {
    it('allows a user to create a subscriber for themselves', async () => {
      const res = await request(createApp(plain)).post('/subscription/v1/subscribers?userSub=true');
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(plain.id);
    });

    it('allows subscription-app to create any subscriber', async () => {
      const res = await request(createApp(app))
        .post('/subscription/v1/subscribers')
        .send({ userId: 'new-user', addressAs: 'New', channels: [{ channel: 'email', address: 'new@test.co' }] });
      expect(res.status).toBe(200);
    });

    it('rejects a user creating a subscriber for someone else', async () => {
      const res = await request(createApp(plain))
        .post('/subscription/v1/subscribers')
        .send({ userId: 'new-user', addressAs: 'New', channels: [] });
      expect(res.status).toBe(401);
    });
  });

  describe('/subscribers/:subscriber', () => {
    it('allows a user to get their own subscriber', async () => {
      const res = await request(createApp(applicant)).get(`/subscription/v1/subscribers/${applicantSubscriberId}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(applicantSubscriberId);
    });

    it.each([
      ['subscription-admin', admin],
      ['subscription-app', app],
    ])('allows %s to get any subscriber', async (_role, currentUser) => {
      const res = await request(createApp(currentUser)).get(`/subscription/v1/subscribers/${otherSubscriberId}`);
      expect(res.status).toBe(200);
    });

    it.each([
      [
        'get',
        (agent: request.SuperTest<request.Test>) => agent.get(`/subscription/v1/subscribers/${otherSubscriberId}`),
      ],
      [
        'update',
        (agent: request.SuperTest<request.Test>) =>
          agent.patch(`/subscription/v1/subscribers/${otherSubscriberId}`).send({ addressAs: 'Changed' }),
      ],
      [
        'delete',
        (agent: request.SuperTest<request.Test>) => agent.delete(`/subscription/v1/subscribers/${otherSubscriberId}`),
      ],
      [
        'get subscriptions of',
        (agent: request.SuperTest<request.Test>) =>
          agent.get(`/subscription/v1/subscribers/${otherSubscriberId}/subscriptions`),
      ],
    ])('responds 403 when a user tries to %s another subscriber', async (_operation, send) => {
      const res = await send(request(createApp(applicant)));
      expect(res.status).toBe(403);
    });

    it('responds 404 for an unknown subscriber', async () => {
      const res = await request(createApp(admin)).get(`/subscription/v1/subscribers/${unknownSubscriberId}`);
      expect(res.status).toBe(404);
    });

    it('responds 400 for a subscriber that is not a subscriber ID', async () => {
      const res = await request(createApp(admin)).get('/subscription/v1/subscribers/not-an-id');
      expect(res.status).toBe(400);
    });

    it('responds 400 when updating channels with a value that is not an array', async () => {
      const res = await request(createApp(applicant))
        .patch(`/subscription/v1/subscribers/${applicantSubscriberId}`)
        .send({ channels: 'email' });
      expect(res.status).toBe(400);
    });

    it.each(['0', '5001'])('responds 400 for subscriptions top=%s', async (top) => {
      const res = await request(createApp(applicant)).get(
        `/subscription/v1/subscribers/${applicantSubscriberId}/subscriptions?top=${top}`,
      );
      expect(res.status).toBe(400);
    });

    it('includes subscriptions when requested', async () => {
      const res = await request(createApp(applicant)).get(
        `/subscription/v1/subscribers/${applicantSubscriberId}?includeSubscriptions=true`,
      );
      expect(res.status).toBe(200);
      expect(res.body.subscriptions).toEqual([]);
    });
  });

  describe('POST /subscribers/:subscriber operations', () => {
    const operation = (op: string, extra = {}) => ({
      operation: op,
      channel: Channel.email,
      address: 'someone-else@test.co',
      ...extra,
    });

    // The subscriber model lets code-sender send and check codes, but the router only reaches the operation after
    // the same access check as retrieving the subscriber, so code-sender alone is not enough.
    it.each(['send-code', 'check-code', 'verify-channel'])(
      'responds 403 when code-sender runs %s for another subscriber',
      async (op) => {
        const res = await request(createApp(codeSender))
          .post(`/subscription/v1/subscribers/${otherSubscriberId}`)
          .send(operation(op, { code: '123' }));
        expect(res.status).toBe(403);
        expect(verifyServiceMock.sendCode).not.toHaveBeenCalled();
        expect(verifyServiceMock.verifyCode).not.toHaveBeenCalled();
      },
    );

    it('allows a user to send a code to their own subscriber', async () => {
      const res = await request(createApp(applicant))
        .post(`/subscription/v1/subscribers/${applicantSubscriberId}`)
        .send(operation('send-code', { address: 'applicant-user@test.co' }));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ sent: true });
    });

    it('allows a user to verify the channel of their own subscriber', async () => {
      const res = await request(createApp(applicant))
        .post(`/subscription/v1/subscribers/${applicantSubscriberId}`)
        .send(operation('verify-channel', { address: 'applicant-user@test.co', code: '123' }));
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ verified: true });
    });

    it('responds 400 for an unrecognized operation', async () => {
      const res = await request(createApp(admin))
        .post(`/subscription/v1/subscribers/${otherSubscriberId}`)
        .send(operation('unknown'));
      expect(res.status).toBe(400);
    });

    it('responds 400 when operation is missing', async () => {
      const res = await request(createApp(admin))
        .post(`/subscription/v1/subscribers/${otherSubscriberId}`)
        .send({ channel: Channel.email, address: 'someone-else@test.co' });
      expect(res.status).toBe(400);
    });

    it('responds 400 for a channel the subscriber does not have', async () => {
      const res = await request(createApp(admin))
        .post(`/subscription/v1/subscribers/${otherSubscriberId}`)
        .send(operation('send-code', { address: 'unknown@test.co' }));
      expect(res.status).toBe(400);
    });
  });

  describe('GET /subscribers/my-subscriber', () => {
    it('gets the subscriber of the current user', async () => {
      const res = await request(createApp(applicant)).get('/subscription/v1/subscribers/my-subscriber');
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(applicantSubscriberId);
    });

    it('responds 404 when the user has no subscriber', async () => {
      const res = await request(createApp(plain)).get('/subscription/v1/subscribers/my-subscriber');
      expect(res.status).toBe(404);
    });
  });
});
