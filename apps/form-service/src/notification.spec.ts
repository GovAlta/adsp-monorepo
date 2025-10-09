import { adspId, Channel } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, ValidationService } from '@core-services/core-common';
import axios from 'axios';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { createNotificationService } from './notification';
import { FormDefinitionEntity } from './form';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('notification', () => {
  const apiId = adspId`urn:ads:platform:form-service:v1`;
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

  const validationService: ValidationService = {
    validate: jest.fn(),
    setSchema: jest.fn(),
  };

  const calendarService = {
    getScheduledIntake: jest.fn(),
  };

  const cacheMock = {
    set: jest.fn(),
    get: jest.fn(),
  };

  beforeEach(() => {
    directoryMock.getServiceUrl.mockReset();
    directoryMock.getResourceUrl.mockReset();
    axiosMock.get.mockReset();
    axiosMock.post.mockReset();
    axiosMock.delete.mockReset();
    axiosMock.isAxiosError.mockReset();
    cacheMock.get.mockReset();
  });

  it('can create service', () => {
    const service = createNotificationService(
      apiId,
      loggerMock,
      directoryMock,
      tokenProviderMock,
      cacheMock as unknown as NodeCache
    );
    expect(service).toBeTruthy();
  });

  describe('NotificationService', () => {
    const service = createNotificationService(
      apiId,
      loggerMock,
      directoryMock,
      tokenProviderMock,
      cacheMock as unknown as NodeCache
    );
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
        expect(axiosMock.get).toHaveBeenCalledWith(
          subscriberUrl.href,
          expect.objectContaining({
            params: expect.objectContaining({ tenantId: tenantId.toString() }),
          })
        );
      });

      it('can return null for error', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);
        axiosMock.get.mockRejectedValueOnce(new Error('oh noes!'));

        const result = await service.getSubscriber(tenantId, subscriberId);
        expect(result).toBeNull();
      });

      it('can return null for subscriber not found', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);

        axiosMock.isAxiosError.mockReturnValueOnce(true);
        axiosMock.get.mockRejectedValueOnce(new Error('oh noes!'));

        const result = await service.getSubscriber(tenantId, subscriberId);
        expect(result).toBeNull();
        expect(axiosMock.get).toHaveBeenCalledWith(
          subscriberUrl.href,
          expect.objectContaining({
            params: expect.objectContaining({ tenantId: tenantId.toString() }),
          })
        );
      });

      it('can get subscriber from cache', async () => {
        cacheMock.get.mockReturnValueOnce(subscriber);
        const result = await service.getSubscriber(tenantId, subscriberId);
        expect(result).toBe(subscriber);
        expect(directoryMock.getResourceUrl).not.toHaveBeenCalled();
        expect(axios.get).not.toHaveBeenCalled();
      });
    });

    describe('subscribe', () => {
      const definition = new FormDefinitionEntity(validationService, calendarService, tenantId, {
        id: 'test',
        name: 'test-form-definition',
        description: null,
        formDraftUrlTemplate: 'https://my-form/{{ id }}',
        anonymousApply: false,
        applicantRoles: ['test-applicant'],
        assessorRoles: ['test-assessor'],
        clerkRoles: [],
        dataSchema: null,
        submissionRecords: false,
        submissionPdfTemplate: '',
        supportTopic: false,
        queueTaskToProcess: null,
      });

      it('can subscribe', async () => {
        const notificationApiUrl = new URL('https://notification-service/notification/v1');
        directoryMock.getServiceUrl.mockResolvedValueOnce(notificationApiUrl);

        axiosMock.post.mockResolvedValueOnce({ data: { subscriber } });
        const result = await service.subscribe(tenantId, definition, 'form-1', subscriber);

        expect(result).toBe(subscriber);
        expect(axios.post).toHaveBeenCalledWith(
          'https://notification-service/notification/v1/types/form-status-updates/subscriptions',
          expect.objectContaining({
            criteria: expect.objectContaining({ correlationId: `${apiId}:/forms/form-1` }),
          }),
          expect.any(Object)
        );
      });

      it('can throw for error', async () => {
        const notificationApiUrl = new URL('https://notification-service/notification/v1');
        directoryMock.getServiceUrl.mockResolvedValueOnce(notificationApiUrl);

        const error = new Error('oh noes!');
        axiosMock.post.mockRejectedValueOnce(error);
        await expect(service.subscribe(tenantId, definition, 'form-1', subscriber)).rejects.toThrow(error);
      });
    });

    describe('unsubscribe', () => {
      it('can unsubscribe', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);
        const notificationApiUrl = new URL('https://notification-service/notification/v1');
        directoryMock.getServiceUrl.mockResolvedValueOnce(notificationApiUrl);

        axiosMock.get.mockResolvedValueOnce({ data: subscriber });
        axiosMock.delete.mockResolvedValueOnce({ data: { deleted: true } });

        const deleted = await service.unsubscribe(tenantId, subscriberId, 'test');
        expect(deleted).toBeTruthy();
        expect(axios.delete).toHaveBeenCalledWith(
          'https://notification-service/notification/v1/types/form-status-updates/subscriptions/test/criteria',
          expect.objectContaining({
            params: expect.objectContaining({
              criteria: JSON.stringify({ correlationId: `${apiId}:/forms/test` }),
            }),
          })
        );
      });

      it('can return false for error', async () => {
        directoryMock.getResourceUrl.mockResolvedValueOnce(subscriberUrl);
        const notificationApiUrl = new URL('https://notification-service/notification/v1');
        directoryMock.getServiceUrl.mockResolvedValueOnce(notificationApiUrl);

        axiosMock.get.mockResolvedValueOnce({ data: subscriber });
        axiosMock.delete.mockRejectedValueOnce(new Error('oh noes!'));

        const deleted = await service.unsubscribe(tenantId, subscriberId, 'test');
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
            reason: 'Enter this code to access your form.',
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
