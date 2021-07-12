import { Logger } from 'winston';
import { Channel } from '../types';
import { createSendNotificationJob } from './sendNotification';

describe('createSendNotificationJob', () => {
  const logger = ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown) as Logger;

  const eventService = {
    send: jest.fn(),
  };

  it('can create job', () => {
    const job = createSendNotificationJob({ logger, eventService, providers: {} });
    expect(job).toBeTruthy();
  });

  describe('sendNotificationJob', () => {
    const providerMock = { send: jest.fn() };
    beforeEach(() => {
      providerMock.send.mockReset();
      eventService.send.mockReset();
    });

    it('can send notification', (done) => {
      const job = createSendNotificationJob({ logger, eventService, providers: { [Channel.email]: providerMock } });
      job(
        {
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          to: 'test@test.co',
          type: { id: 'test', name: 'test' },
          event: { namespace: 'test', name: 'test' },
          message: { subject: 'testing', body: '123' },
          channel: Channel.email,
          subscriber: { id: 'test', userId: 'test', addressAs: 'Testy McTester' },
        },
        (err) => {
          expect(err).toBeFalsy();
          expect(providerMock.send).toHaveBeenCalledTimes(1);
          expect(eventService.send).toHaveBeenCalledTimes(1);
          done();
        }
      );
    });

    it('can throw for missing provider', async () => {
      const job = createSendNotificationJob({ logger, eventService, providers: { [Channel.email]: providerMock } });
      await expect(
        job(
          {
            tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
            to: 'test@test.co',
            type: { id: 'test', name: 'test' },
            event: { namespace: 'test', name: 'test' },
            message: { subject: 'testing', body: '123' },
            channel: Channel.sms,
            subscriber: { id: 'test', userId: 'test', addressAs: 'Testy McTester' },
          },
          null
        )
      ).rejects.toThrow(/No provider found for channel: sms/);
    });

    it('can handle provider error', (done) => {
      const job = createSendNotificationJob({ logger, eventService, providers: { [Channel.email]: providerMock } });

      const error = new Error('Something is wrong.');
      providerMock.send.mockRejectedValue(error);
      job(
        {
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          to: 'test@test.co',
          type: { id: 'test', name: 'test' },
          event: { namespace: 'test', name: 'test' },
          message: { subject: 'testing', body: '123' },
          channel: Channel.email,
          subscriber: { id: 'test', userId: 'test', addressAs: 'Testy McTester' },
        },
        (err) => {
          expect(err).toBe(error);
          expect(providerMock.send).toHaveBeenCalledTimes(1);
          expect(eventService.send).toHaveBeenCalledTimes(0);
          done();
        }
      );
    });
  });
});
