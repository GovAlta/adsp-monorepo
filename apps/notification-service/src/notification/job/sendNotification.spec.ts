import { Logger } from 'winston';
import { Channel } from '../types';
import { createSendNotificationJob } from './sendNotification';

describe('createSendNotificationJob', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const eventService = {
    send: jest.fn(),
  };

  const auditor = jest.fn();

  it('can create job', () => {
    const job = createSendNotificationJob({ logger, eventService, auditor, providers: {} });
    expect(job).toBeTruthy();
  });

  describe('sendNotificationJob', () => {
    const providerMock = { send: jest.fn() };
    beforeEach(() => {
      providerMock.send.mockReset();
      eventService.send.mockReset();
      auditor.mockReset();
    });

    it('can send notification', (done) => {
      const job = createSendNotificationJob({ logger, eventService, auditor, providers: { [Channel.email]: providerMock } });
      job(
        {
          generationId: 'test',
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          to: 'test@test.co',
          type: { id: 'test', name: 'test' },
          event: { namespace: 'test', name: 'test', timestamp: new Date() },
          message: { subject: 'testing', body: '123' },
          channel: Channel.email,
          subscriber: { id: 'test', userId: 'test', addressAs: 'Testy McTester' },
        },
        true,
        (err) => {
          expect(err).toBeFalsy();
          expect(providerMock.send).toHaveBeenCalledTimes(1);
          expect(eventService.send).toHaveBeenCalledTimes(1);
          expect(auditor).toHaveBeenCalledTimes(1);
          const [action, details] = auditor.mock.calls[0];
          expect(action.name).toBe('notification.sent');
          expect(details).toEqual({
            tenantId: expect.objectContaining({ resource: '/tenants/test' }),
            actor: { id: 'notification-service-job', type: 'system', name: 'Notification service job' },
            resource: { type: 'subscription', id: 'test:test' },
            correlationId: undefined,
            metadata: {
              typeId: 'test',
              channel: Channel.email,
              event: 'test:test',
              subscriberId: 'test',
              contextKeys: [],
            },
          });
          expect(JSON.stringify(details)).not.toContain('test@test.co');
          expect(JSON.stringify(details)).not.toContain('testing');
          done();
        }
      );
    });

    it('can send notification of a direct type against the notification type', async () => {
      const job = createSendNotificationJob({ logger, eventService, auditor, providers: { [Channel.email]: providerMock } });
      await job(
        {
          generationId: 'test',
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          to: 'test@test.co',
          type: { id: 'test', name: 'test' },
          event: { namespace: 'test', name: 'test', timestamp: new Date() },
          message: { subject: 'testing', body: '123' },
          channel: Channel.email,
        },
        true,
        (err) => expect(err).toBeFalsy()
      );
      expect(auditor).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'notification.direct-sent', resourceType: 'notification-type' }),
        expect.objectContaining({ resource: { type: 'notification-type', id: 'test', name: 'test' } })
      );
    });

    it('can throw for missing provider', async () => {
      const job = createSendNotificationJob({ logger, eventService, auditor, providers: { [Channel.email]: providerMock } });
      await expect(
        job(
          {
            generationId: 'test',
            tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
            to: 'test@test.co',
            type: { id: 'test', name: 'test' },
            event: { namespace: 'test', name: 'test', timestamp: new Date() },
            message: { subject: 'testing', body: '123' },
            channel: Channel.sms,
            subscriber: { id: 'test', userId: 'test', addressAs: 'Testy McTester' },
          },
          true,
          null
        )
      ).rejects.toThrow(/No provider found for channel: sms/);
    });

    it('can handle provider error', (done) => {
      const job = createSendNotificationJob({ logger, eventService, auditor, providers: { [Channel.email]: providerMock } });

      const error = new Error('Something is wrong.');
      providerMock.send.mockRejectedValue(error);
      job(
        {
          generationId: 'test',
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          to: 'test@test.co',
          type: { id: 'test', name: 'test' },
          event: { namespace: 'test', name: 'test', timestamp: new Date() },
          message: { subject: 'testing', body: '123' },
          channel: Channel.email,
          subscriber: { id: 'test', userId: 'test', addressAs: 'Testy McTester' },
        },
        true,
        (err) => {
          expect(err).toBe(error);
          expect(providerMock.send).toHaveBeenCalledTimes(1);
          expect(eventService.send).toHaveBeenCalledTimes(0);
          expect(auditor).not.toHaveBeenCalled();
          done();
        }
      );
    });

    it('can send event on no more retries', async () => {
      const job = createSendNotificationJob({ logger, eventService, auditor, providers: { [Channel.email]: providerMock } });

      const error = new Error('Something is wrong.');
      providerMock.send.mockRejectedValue(error);
      await job(
        {
          generationId: 'test',
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          to: 'test@test.co',
          type: { id: 'test', name: 'test' },
          event: { namespace: 'test', name: 'test', timestamp: new Date() },
          message: { subject: 'testing', body: '123' },
          channel: Channel.email,
          subscriber: { id: 'test', userId: 'test', addressAs: 'Testy McTester' },
        },
        false,
        (err) => {
          expect(err).toBe(error);
          expect(providerMock.send).toHaveBeenCalledTimes(1);
        }
      );
      expect(eventService.send).toHaveBeenCalledWith(expect.objectContaining({ name: 'notification-send-failed' }));
      expect(auditor).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'notification.send-failed' }),
        expect.objectContaining({
          status: 'failure',
          resource: { type: 'subscription', id: 'test:test' },
          metadata: expect.objectContaining({ error: 'Something is wrong.' }),
        })
      );
      expect(auditor).not.toHaveBeenCalledWith(expect.objectContaining({ name: 'notification.sent' }), expect.anything());
    });
  });
});
