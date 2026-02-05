import '@abgov/adsp-service-sdk';
import { adspId, Channel } from '@abgov/adsp-service-sdk';
import { connect, connection, model, Types } from 'mongoose';
import { Logger } from 'winston';
import { MongoSubscriptionRepository } from './subscription';
import { NotificationConfiguration, NotificationTypeEntity } from '../notification';

describe('MongoSubscriptionRepository', () => {
  const logger: Logger = {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  let repo: MongoSubscriptionRepository;
  let mongoose: typeof import('mongoose');

  beforeAll(async () => {
    mongoose = await connect(process.env.MONGO_URL);
    repo = new MongoSubscriptionRepository(logger);
  });

  beforeEach(async () => {
    await model('subscriber').deleteMany({});
    await model('subscription').deleteMany({});
  });

  afterAll(async () => {
    await connection.close();
  });

  function generateId(): string {
    return new mongoose.Types.ObjectId().toHexString();
  }

  describe('saveSubscriber and getSubscriber', () => {
    it('should save and retrieve a subscriber by ID', async () => {
      const subscriberId = generateId();
      const subscriber = await repo.saveSubscriber({
        id: subscriberId,
        tenantId,
        addressAs: 'Test User',
        userId: 'user-123',
        channels: [
          { channel: Channel.email, address: 'test@example.com', verified: true },
          { channel: Channel.sms, address: '+15551234567', verified: false },
        ],
      } as never);

      expect(subscriber.id).toBeTruthy();
      expect(subscriber.addressAs).toBe('Test User');

      const retrieved = await repo.getSubscriber(tenantId, subscriber.id);
      expect(retrieved).toBeTruthy();
      expect(retrieved.addressAs).toBe('Test User');
      expect(retrieved.channels).toHaveLength(2);
    });

    it('should retrieve a subscriber by userId', async () => {
      await repo.saveSubscriber({
        tenantId,
        addressAs: 'User By ID',
        userId: 'unique-user-id',
        channels: [{ channel: Channel.email, address: 'byid@example.com', verified: true }],
      } as never);

      const retrieved = await repo.getSubscriber(tenantId, 'unique-user-id', true);
      expect(retrieved).toBeTruthy();
      expect(retrieved.addressAs).toBe('User By ID');
    });

    it('should return null for non-existent subscriber', async () => {
      const retrieved = await repo.getSubscriber(tenantId, generateId());
      expect(retrieved).toBeNull();
    });
  });

  describe('findSubscribers', () => {
    beforeEach(async () => {
      // Create test subscribers
      await repo.saveSubscriber({
        tenantId,
        addressAs: 'John Doe',
        channels: [
          { channel: Channel.email, address: 'john@example.com', verified: true },
          { channel: Channel.sms, address: '+15551111111', verified: true },
        ],
      } as never);

      await repo.saveSubscriber({
        tenantId,
        addressAs: 'Jane Smith',
        channels: [{ channel: Channel.email, address: 'jane@example.com', verified: true }],
      } as never);

      await repo.saveSubscriber({
        tenantId,
        addressAs: 'Bob Wilson',
        channels: [{ channel: Channel.sms, address: '+15552222222', verified: true }],
      } as never);
    });

    it('should find subscribers by tenant', async () => {
      const results = await repo.findSubscribers(10, null, { tenantIdEquals: tenantId });
      expect(results.results).toHaveLength(3);
    });

    it('should find subscribers by name (case insensitive)', async () => {
      const results = await repo.findSubscribers(10, null, {
        tenantIdEquals: tenantId,
        name: 'john',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].addressAs).toBe('John Doe');
    });

    it('should find subscribers by email (case insensitive)', async () => {
      const results = await repo.findSubscribers(10, null, {
        tenantIdEquals: tenantId,
        email: 'JANE@EXAMPLE.COM',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].addressAs).toBe('Jane Smith');
    });

    it('should find subscribers by SMS', async () => {
      const results = await repo.findSubscribers(10, null, {
        tenantIdEquals: tenantId,
        sms: '5551111',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].addressAs).toBe('John Doe');
    });

    it('should find subscribers with both email and SMS', async () => {
      const results = await repo.findSubscribers(10, null, {
        tenantIdEquals: tenantId,
        email: 'john@example.com',
        sms: '5551111',
      });
      expect(results.results).toHaveLength(1);
      expect(results.results[0].addressAs).toBe('John Doe');
    });

    it('should return empty when no subscribers match email and SMS combination', async () => {
      const results = await repo.findSubscribers(10, null, {
        tenantIdEquals: tenantId,
        email: 'jane@example.com',
        sms: '5551111', // Jane doesn't have SMS
      });
      expect(results.results).toHaveLength(0);
    });

    it('should paginate results', async () => {
      const page1 = await repo.findSubscribers(2, null, { tenantIdEquals: tenantId });
      expect(page1.results).toHaveLength(2);
      expect(page1.page.next).toBeTruthy();

      const page2 = await repo.findSubscribers(2, page1.page.next, { tenantIdEquals: tenantId });
      expect(page2.results).toHaveLength(1);
    });
  });

  describe('saveSubscription and getSubscription', () => {
    let subscriberId: string;
    let notificationType: NotificationTypeEntity;

    beforeEach(async () => {
      const subscriber = await repo.saveSubscriber({
        tenantId,
        addressAs: 'Subscription Tester',
        channels: [{ channel: Channel.email, address: 'sub@example.com', verified: true }],
      } as never);
      subscriberId = subscriber.id;

      notificationType = {
        tenantId,
        id: 'test-notification-type',
        name: 'Test Notification',
        channels: [Channel.email],
      } as NotificationTypeEntity;
    });

    it('should save and retrieve a subscription', async () => {
      await repo.saveSubscription({
        tenantId,
        typeId: 'test-notification-type',
        subscriberId,
        criteria: [{ correlationId: 'form-123', context: { formId: 'abc' } }],
      } as never);

      const subscription = await repo.getSubscription(notificationType, subscriberId);
      expect(subscription).toBeTruthy();
      expect(subscription.typeId).toBe('test-notification-type');
      expect(subscription.criteria).toHaveLength(1);
      expect(subscription.criteria[0].correlationId).toBe('form-123');
    });

    it('should update existing subscription on save', async () => {
      await repo.saveSubscription({
        tenantId,
        typeId: 'test-notification-type',
        subscriberId,
        criteria: [{ correlationId: 'form-123' }],
      } as never);

      await repo.saveSubscription({
        tenantId,
        typeId: 'test-notification-type',
        subscriberId,
        criteria: [{ correlationId: 'form-456' }, { correlationId: 'form-789' }],
      } as never);

      const subscription = await repo.getSubscription(notificationType, subscriberId);
      expect(subscription.criteria).toHaveLength(2);
      expect(subscription.criteria[0].correlationId).toBe('form-456');
    });
  });

  describe('getSubscriptions', () => {
    let subscriber1Id: string;
    let subscriber2Id: string;
    let subscriber3Id: string;
    let configuration: NotificationConfiguration;
    let notificationType: NotificationTypeEntity;

    beforeEach(async () => {
      // Create subscribers
      const subscriber1 = await repo.saveSubscriber({
        tenantId,
        addressAs: 'Subscriber One',
        channels: [
          { channel: Channel.email, address: 'one@example.com', verified: true },
          { channel: Channel.sms, address: '+15551111111', verified: true },
        ],
      } as never);
      subscriber1Id = subscriber1.id;

      const subscriber2 = await repo.saveSubscriber({
        tenantId,
        addressAs: 'Subscriber Two',
        channels: [{ channel: Channel.email, address: 'two@example.com', verified: true }],
      } as never);
      subscriber2Id = subscriber2.id;

      const subscriber3 = await repo.saveSubscriber({
        tenantId,
        addressAs: 'Subscriber Three',
        channels: [{ channel: Channel.sms, address: '+15553333333', verified: true }],
      } as never);
      subscriber3Id = subscriber3.id;

      notificationType = {
        tenantId,
        id: 'form-submitted',
        name: 'Form Submitted',
        channels: [Channel.email, Channel.sms],
      } as NotificationTypeEntity;

      configuration = {
        getNotificationTypes: () => [notificationType],
        getNotificationType: (id: string) => (id === 'form-submitted' ? notificationType : null),
      } as NotificationConfiguration;

      // Create subscriptions with different criteria
      // Subscriber 1: specific correlationId
      await repo.saveSubscription({
        tenantId,
        typeId: 'form-submitted',
        subscriberId: subscriber1Id,
        criteria: [{ correlationId: 'form-123', context: { category: 'support' } }],
      } as never);

      // Subscriber 2: catch-all (null criteria)
      await repo.saveSubscription({
        tenantId,
        typeId: 'form-submitted',
        subscriberId: subscriber2Id,
        criteria: [{}],
      } as never);

      // Subscriber 3: different context
      await repo.saveSubscription({
        tenantId,
        typeId: 'form-submitted',
        subscriberId: subscriber3Id,
        criteria: [{ context: { category: 'billing' } }],
      } as never);
    });

    it('should retrieve all subscriptions for a type', async () => {
      const results = await repo.getSubscriptions(configuration, tenantId, 10, null, {
        typeIdEquals: 'form-submitted',
      });

      expect(results.results).toHaveLength(3);
    });

    it('should retrieve subscriptions by subscriberId', async () => {
      const results = await repo.getSubscriptions(configuration, tenantId, 10, null, {
        typeIdEquals: 'form-submitted',
        subscriberIdEquals: subscriber1Id,
      });

      expect(results.results).toHaveLength(1);
      expect(results.results[0].subscriberId).toBe(subscriber1Id);
    });

    it('should match subscriptions with correlationId criteria', async () => {
      const results = await repo.getSubscriptions(configuration, tenantId, 10, null, {
        typeIdEquals: 'form-submitted',
        subscriptionMatch: { correlationId: 'form-123' },
      });

      // Should match: subscriber1 (specific match) and subscriber2 (catch-all)
      expect(results.results.length).toBeGreaterThanOrEqual(2);
      const subscriberIds = results.results.map((r) => r.subscriberId);
      expect(subscriberIds).toContain(subscriber1Id);
      expect(subscriberIds).toContain(subscriber2Id);
    });

    it('should match subscriptions with context criteria', async () => {
      const results = await repo.getSubscriptions(configuration, tenantId, 10, null, {
        typeIdEquals: 'form-submitted',
        subscriptionMatch: { context: { category: 'billing' } },
      });

      // Should match: subscriber2 (catch-all) and subscriber3 (specific billing context)
      const subscriberIds = results.results.map((r) => r.subscriberId);
      expect(subscriberIds).toContain(subscriber2Id);
      expect(subscriberIds).toContain(subscriber3Id);
    });

    it('should filter by subscriber email', async () => {
      const results = await repo.getSubscriptions(configuration, tenantId, 10, null, {
        typeIdEquals: 'form-submitted',
        subscriberCriteria: { email: 'one@example.com' },
      });

      expect(results.results).toHaveLength(1);
      expect(results.results[0].subscriberId).toBe(subscriber1Id);
    });

    it('should filter by subscriber SMS', async () => {
      const results = await repo.getSubscriptions(configuration, tenantId, 10, null, {
        typeIdEquals: 'form-submitted',
        subscriberCriteria: { sms: '5553333' },
      });

      expect(results.results).toHaveLength(1);
      expect(results.results[0].subscriberId).toBe(subscriber3Id);
    });

    it('should filter by subscriber name', async () => {
      const results = await repo.getSubscriptions(configuration, tenantId, 10, null, {
        typeIdEquals: 'form-submitted',
        subscriberCriteria: { name: 'Two' },
      });

      expect(results.results).toHaveLength(1);
      expect(results.results[0].subscriberId).toBe(subscriber2Id);
    });

    it('should paginate subscriptions', async () => {
      const page1 = await repo.getSubscriptions(configuration, tenantId, 2, null, {
        typeIdEquals: 'form-submitted',
      });

      expect(page1.results).toHaveLength(2);
      expect(page1.page.next).toBeTruthy();

      const page2 = await repo.getSubscriptions(configuration, tenantId, 2, page1.page.next, {
        typeIdEquals: 'form-submitted',
      });

      expect(page2.results).toHaveLength(1);
    });

    it('should return catch-all and context-matching subscriptions for non-matching correlationId', async () => {
      const results = await repo.getSubscriptions(configuration, tenantId, 10, null, {
        typeIdEquals: 'form-submitted',
        subscriptionMatch: { correlationId: 'non-existent-form' },
      });

      // Catch-all (subscriber2) matches because it has no correlationId criteria
      // Subscriber3 matches because it has no correlationId criteria (only context)
      // Subscriber1 does NOT match because it has a specific correlationId
      expect(results.results).toHaveLength(2);
      const subscriberIds = results.results.map((r) => r.subscriberId);
      expect(subscriberIds).toContain(subscriber2Id);
      expect(subscriberIds).toContain(subscriber3Id);
      expect(subscriberIds).not.toContain(subscriber1Id);
    });
  });

  describe('deleteSubscriptions', () => {
    let subscriberId: string;

    beforeEach(async () => {
      const subscriber = await repo.saveSubscriber({
        tenantId,
        addressAs: 'Delete Tester',
        channels: [{ channel: Channel.email, address: 'delete@example.com', verified: true }],
      } as never);
      subscriberId = subscriber.id;

      await repo.saveSubscription({
        tenantId,
        typeId: 'type-1',
        subscriberId,
        criteria: [{}],
      } as never);

      await repo.saveSubscription({
        tenantId,
        typeId: 'type-2',
        subscriberId,
        criteria: [{}],
      } as never);
    });

    it('should delete subscriptions by type', async () => {
      const deleted = await repo.deleteSubscriptions(tenantId, 'type-1', null);
      expect(deleted).toBe(true);

      const type1 = {
        tenantId,
        id: 'type-1',
      } as NotificationTypeEntity;

      const subscription = await repo.getSubscription(type1, subscriberId);
      expect(subscription).toBeNull();
    });

    it('should delete subscriptions by subscriber', async () => {
      const deleted = await repo.deleteSubscriptions(null, null, subscriberId);
      expect(deleted).toBe(true);
    });

    it('should return false when no subscriptions deleted', async () => {
      const deleted = await repo.deleteSubscriptions(tenantId, 'non-existent-type', null);
      expect(deleted).toBe(false);
    });
  });

  describe('deleteSubscriber', () => {
    it('should delete subscriber and their subscriptions', async () => {
      const subscriber = await repo.saveSubscriber({
        tenantId,
        addressAs: 'To Be Deleted',
        channels: [{ channel: Channel.email, address: 'deleted@example.com', verified: true }],
      } as never);

      await repo.saveSubscription({
        tenantId,
        typeId: 'test-type',
        subscriberId: subscriber.id,
        criteria: [{}],
      } as never);

      const deleted = await repo.deleteSubscriber(subscriber);
      expect(deleted).toBe(true);

      const retrieved = await repo.getSubscriber(tenantId, subscriber.id);
      expect(retrieved).toBeNull();
    });
  });
});
