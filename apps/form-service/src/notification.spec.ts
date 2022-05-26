import { adspId, Channel } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import axios from 'axios';
import { Logger } from 'winston';
import { createNotificationService } from './notification';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('notification', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  beforeEach(() => {
    directoryMock.getServiceUrl.mockReset();
    directoryMock.getResourceUrl.mockReset();
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.delete.mockReset();
  });

  it('can create service', () => {
    const service = createNotificationService(loggerMock, directoryMock, tokenProviderMock);
    expect(service).toBeTruthy();
  });

  describe('NotificationService', () => {
    const service = createNotificationService(loggerMock, directoryMock, tokenProviderMock);
    const subscriberId = adspId`urn:ads:platform:notification-service:v1:/subscribers/test`;
    const subscriberUrl = new URL('https://notification-service/notification/v1/subscribers/test');
    const subscriber = {
      id: 'test',
      urn: subscriberId.toString(),
      userId: 'user',
      addressAs: 'Tester',
      channels: [
        {
          channel: Channel.email,
          address: 'tester@test.co',
        },
      ],
    };

    describe('getSubscriber', () => {
      it('can get subscriber', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);

        axiosMock.get.mockResolvedValueOnce({ data: subscriber });

        const result = await service.getSubscriber(tenantId, subscriberId);
        const { urn: _urn, ...subscriberData } = subscriber;
        expect(result).toMatchObject(subscriberData);
        expect(axiosMock.get).toHaveBeenCalledWith(`${subscriberUrl.href}?tenantId=${tenantId}`, expect.any(Object));
      });

      it('can return null for error', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);
        axiosMock.get.mockRejectedValueOnce(new Error('oh noes!'));

        const result = await service.getSubscriber(tenantId, subscriberId);
        expect(result).toBeNull();
      });
    });

    describe('subscribe', () => {
      it('can subscribe', async () => {
        const notificationApiUrl = new URL('https://notification-service/notification/v1');
        directoryMock.getServiceUrl.mockResolvedValueOnce(notificationApiUrl);

        axiosMock.post.mockResolvedValueOnce({ data: { subscriber } });
        const result = await service.subscribe(tenantId, 'form-1', subscriber);

        expect(result).toBe(subscriber);
      });

      it('can throw for error', async () => {
        const notificationApiUrl = new URL('https://notification-service/notification/v1');
        directoryMock.getServiceUrl.mockResolvedValueOnce(notificationApiUrl);

        const error = new Error('oh noes!');
        axiosMock.post.mockRejectedValueOnce(error);
        await expect(service.subscribe(tenantId, 'form-1', subscriber)).rejects.toThrow(error);
      });
    });

    describe('unsubscribe', () => {
      it('can unsubscribe', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);
        const notificationApiUrl = new URL('https://notification-service/notification/v1');
        directoryMock.getServiceUrl.mockResolvedValueOnce(notificationApiUrl);

        axiosMock.get.mockResolvedValueOnce({ data: subscriber });
        axiosMock.delete.mockResolvedValueOnce({ data: { deleted: true } });

        const deleted = await service.unsubscribe(tenantId, subscriberId);
        expect(deleted).toBeTruthy();
      });

      it('can return false for error', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);
        const notificationApiUrl = new URL('https://notification-service/notification/v1');
        directoryMock.getServiceUrl.mockResolvedValueOnce(notificationApiUrl);

        axiosMock.get.mockResolvedValueOnce({ data: subscriber });
        axiosMock.delete.mockRejectedValueOnce(new Error('oh noes!'));

        const deleted = await service.unsubscribe(tenantId, subscriberId);
        expect(deleted).toBeFalsy();
      });
    });

    describe('sendCode', () => {
      it('can send code', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);

        axiosMock.post.mockResolvedValueOnce({ data: { sent: true } });
        await service.sendCode(tenantId, { ...subscriber, urn: subscriberId });
        expect(axiosMock.post).toHaveBeenCalledWith(
          `${subscriberUrl.href}?tenantId=${tenantId}`,
          expect.objectContaining({
            operation: 'send-code',
            channel: subscriber.channels[0].channel,
            address: subscriber.channels[0].address,
            reason: 'Enter this code to access your draft form.',
          }),
          expect.any(Object)
        );
      });

      it('can throw for no subscriber channel', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);
        await expect(service.sendCode(tenantId, { ...subscriber, channels: [], urn: subscriberId })).rejects.toThrow(
          InvalidOperationError
        );
      });

      it('can throw for code error', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);

        const error = new Error('oh noes!');
        axiosMock.post.mockRejectedValueOnce(error);
        await expect(service.sendCode(tenantId, { ...subscriber, urn: subscriberId })).rejects.toThrow(error);
      });
    });

    describe('verifyCode', () => {
      it('can verify code', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);

        axiosMock.post.mockResolvedValueOnce({ data: { verified: true } });

        const result = await service.verifyCode(tenantId, { ...subscriber, urn: subscriberId }, 'test');
        expect(result).toBeTruthy();
        expect(axiosMock.post).toHaveBeenCalledWith(
          `${subscriberUrl.href}?tenantId=${tenantId}`,
          expect.objectContaining({
            operation: 'check-code',
            channel: subscriber.channels[0].channel,
            address: subscriber.channels[0].address,
            code: 'test',
          }),
          expect.any(Object)
        );
      });

      it('can return false for no subscriber channel', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);
        const result = await service.verifyCode(tenantId, { ...subscriber, channels: [], urn: subscriberId }, 'test');
        expect(result).toBeFalsy();
      });

      it('can return false for code error', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);

        axiosMock.post.mockRejectedValueOnce(new Error('oh noes!'));

        const result = await service.verifyCode(tenantId, { ...subscriber, urn: subscriberId }, 'test');
        expect(result).toBeFalsy();
      });
    });
  });
});
