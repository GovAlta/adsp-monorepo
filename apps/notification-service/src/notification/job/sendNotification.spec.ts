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

  it('can create job', () => {
    const job = createSendNotificationJob({ logger, providers: {} });
    expect(job).toBeTruthy();
  });

  describe('sendNotificationJob', () => {
    const providerMock = { send: jest.fn() };
    beforeEach(() => {
      providerMock.send.mockReset();
    });

    it('can send notification', (done) => {
      const job = createSendNotificationJob({ logger, providers: { [Channel.email]: providerMock } });
      job(
        {
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          to: 'test@test.co',
          typeId: 'test',
          message: { subject: 'testing', body: '123' },
          channel: Channel.email,
        },
        (err) => {
          expect(err).toBeFalsy();
          expect(providerMock.send).toHaveBeenCalledTimes(1);
          done();
        }
      );
    });

    it('can throw for missing provider', async () => {
      const job = createSendNotificationJob({ logger, providers: { [Channel.email]: providerMock } });
      await expect(
        job(
          {
            tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
            to: 'test@test.co',
            typeId: 'test',
            message: { subject: 'testing', body: '123' },
            channel: Channel.sms,
          },
          null
        )
      ).rejects.toThrow(/No provider found for channel: sms/);
    });

    it('can handle provider error', (done) => {
      const job = createSendNotificationJob({ logger, providers: { [Channel.email]: providerMock } });

      const error = new Error('Something is wrong.');
      providerMock.send.mockRejectedValue(error);
      job(
        {
          tenantId: 'urn:ads:platform:tenant-service:v2:/tenants/test',
          to: 'test@test.co',
          typeId: 'test',
          message: { subject: 'testing', body: '123' },
          channel: Channel.email,
        },
        (err) => {
          expect(err).toBe(error);
          expect(providerMock.send).toHaveBeenCalledTimes(1);
          done();
        }
      );
    });
  });
});
