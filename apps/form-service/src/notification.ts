import { adspId, AdspId, Channel, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import axios, { isAxiosError } from 'axios';
import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { FormDefinition } from './form';

export interface Subscriber {
  id: string;
  urn: AdspId;
  userId: string;
  addressAs: string;
  channels: { channel: Channel; address: string }[];
}

export interface NotificationService {
  getSubscriber(tenantId: AdspId, urn: AdspId): Promise<Subscriber>;
  subscribe(
    tenantId: AdspId,
    definition: FormDefinition,
    formId: string,
    subscriber?: Omit<Subscriber, 'urn'>
  ): Promise<Subscriber>;
  unsubscribe(tenantId: AdspId, urn: AdspId, formId: string): Promise<boolean>;
  sendCode(tenantId: AdspId, subscriber: Subscriber): Promise<void>;
  verifyCode(tenantId: AdspId, subscriber: Subscriber, code: string): Promise<boolean>;
}

const LOG_CONTEXT = { context: 'NotificationService' };
class NotificationServiceImpl implements NotificationService {
  private notificationApiId = adspId`urn:ads:platform:notification-service:v1`;

  constructor(
    private apiId: AdspId,
    private logger: Logger,
    private directory: ServiceDirectory,
    private tokenProvider: TokenProvider,
    private subscriberCache: NodeCache
  ) {}

  private getCacheKey(tenantId: AdspId, urn: AdspId) {
    return `${tenantId}${urn}`;
  }

  async getSubscriber(tenantId: AdspId, urn: AdspId): Promise<Subscriber> {
    try {
      const key = this.getCacheKey(tenantId, urn);
      let subscriber = this.subscriberCache.get<Subscriber>(key);

      if (!subscriber) {
        const subscriberUrl = await this.directory.getResourceUrl(urn);

        const token = await this.tokenProvider.getAccessToken();
        const { data } = await axios.get<Omit<Subscriber, 'urn'> & { urn: string }>(subscriberUrl.href, {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId.toString() },
        });

        subscriber = {
          id: data.id,
          urn: AdspId.parse(data.urn),
          userId: data.userId,
          addressAs: data.addressAs,
          channels: data.channels,
        };
        this.subscriberCache.set(key, subscriber);
      }

      return subscriber;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) {
        this.logger.info(`Notification service returned not found for subscriber ${urn}.`, {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      } else {
        this.logger.error(`Error encountered getting subscriber from notification service. ${err}`, {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        });
      }

      return null;
    }
  }

  async subscribe(
    tenantId: AdspId,
    definition: FormDefinition,
    formId: string,
    subscriber?: Omit<Subscriber, 'urn'>
  ): Promise<Subscriber> {
    try {
      const apiUrl = await this.directory.getServiceUrl(this.notificationApiId);
      const subscriptionUrl = new URL('v1/types/form-status-updates/subscriptions', apiUrl);

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ subscriber: Subscriber }>(
        subscriptionUrl.href,
        {
          ...subscriber,
          criteria: {
            description: `Updates on ${definition.name}.`,
            correlationId: `${this.apiId}:/forms/${formId}`,
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: tenantId.toString() },
        }
      );

      return data.subscriber;
    } catch (err) {
      this.logger.error(
        `Error encountered subscribing for form (ID: ${formId}) applicant ${subscriber.addressAs} (User ID: ${subscriber.userId}). ${err}`,
        {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        }
      );
      throw err;
    }
  }

  async unsubscribe(tenantId: AdspId, urn: AdspId, formId: string): Promise<boolean> {
    try {
      let deleted = false;
      const subscriber = await this.getSubscriber(tenantId, urn);
      if (subscriber) {
        const apiUrl = await this.directory.getServiceUrl(this.notificationApiId);
        const subscriptionUrl = new URL(`v1/types/form-status-updates/subscriptions/${subscriber.id}/criteria`, apiUrl);

        const token = await this.tokenProvider.getAccessToken();
        const { data } = await axios.delete<{ deleted: boolean }>(subscriptionUrl.href, {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            tenantId: tenantId.toString(),
            criteria: JSON.stringify({
              correlationId: `${this.apiId}:/forms/${formId}`,
            }),
          },
        });
        deleted = data.deleted;
      }
      return deleted;
    } catch (err) {
      this.logger.warn(`Error encountered unsubscribing for subscriber ${urn}. ${err}`, {
        ...LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });

      return false;
    }
  }

  async sendCode(tenantId: AdspId, subscriber: Subscriber): Promise<void> {
    try {
      const subscriberUrl = await this.directory.getResourceUrl(subscriber.urn);
      const [channel] = subscriber?.channels || [];
      if (!channel) {
        throw new InvalidOperationError('Subscriber has no channels for code.');
      }

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ sent: boolean }>(
        `${subscriberUrl.href}?tenantId=${tenantId}`,
        {
          operation: 'send-code',
          channel: channel.channel,
          address: channel.address,
          reason: 'Enter this code to access your form.',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.sent) {
        this.logger.info(
          `Sent code to subscriber ${subscriber.addressAs} (User ID: ${subscriber.userId}) at ${channel.address}`,
          {
            ...LOG_CONTEXT,
            tenant: tenantId?.toString(),
          }
        );
      }
    } catch (err) {
      this.logger.error(
        `Error encountered sending code to applicant ${subscriber.addressAs} (User ID: ${subscriber.userId}). ${err}`,
        {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        }
      );
      throw err;
    }
  }

  async verifyCode(tenantId: AdspId, subscriber: Subscriber, code: string): Promise<boolean> {
    try {
      const subscriberUrl = await this.directory.getResourceUrl(subscriber.urn);
      const [channel] = subscriber?.channels || [];
      if (!channel) {
        throw new InvalidOperationError('Subscriber has no channels for code.');
      }

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ verified: boolean }>(
        `${subscriberUrl.href}?tenantId=${tenantId}`,
        {
          operation: 'check-code',
          channel: channel.channel,
          address: channel.address,
          code,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return data.verified;
    } catch (err) {
      this.logger.error(
        `Error encountered verifying code for applicant ${subscriber.addressAs} (User ID: ${subscriber.userId}). ${err}`,
        {
          ...LOG_CONTEXT,
          tenant: tenantId?.toString(),
        }
      );
      return false;
    }
  }
}

export function createNotificationService(
  apiId: AdspId,
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  subscriberCache = new NodeCache({ stdTTL: 3600, useClones: false })
): NotificationService {
  return new NotificationServiceImpl(apiId, logger, directory, tokenProvider, subscriberCache);
}
