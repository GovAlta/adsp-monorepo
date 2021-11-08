import { adspId, AdspId, Channel, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import axios from 'axios';
import { Logger } from 'winston';

export interface Subscriber {
  id: string;
  urn: AdspId;
  userId: string;
  addressAs: string;
  channels: { channel: Channel; address: string }[];
}

export interface NotificationService {
  getSubscriber(tenantId: AdspId, urn: AdspId): Promise<Subscriber>;
  subscribe(tenantId: AdspId, formId: string, subscriber: Omit<Subscriber, 'urn'>): Promise<Subscriber>;
  unsubscribe(tenantId: AdspId, urn: AdspId): Promise<boolean>;
  sendCode(tenantId: AdspId, subscriber: Subscriber): Promise<void>;
  verifyCode(tenantId: AdspId, subscriber: Subscriber, code: string): Promise<boolean>;
}

const LOG_CONTEXT = { context: 'NotificationService' };
class NotificationServiceImpl implements NotificationService {
  private notificationApiId = adspId`urn:ads:platform:notification-service:v1`;

  constructor(private logger: Logger, private directory: ServiceDirectory, private tokenProvider: TokenProvider) {}

  async getSubscriber(tenantId: AdspId, urn: AdspId): Promise<Subscriber> {
    try {
      const subscriberUrl = await this.directory.getResourceUrl(urn);

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.get<Omit<Subscriber, 'urn'> & { urn: string }>(
        `${subscriberUrl.href}?tenantId=${tenantId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return {
        id: data.id,
        urn: AdspId.parse(data.urn),
        userId: data.userId,
        addressAs: data.addressAs,
        channels: data.channels,
      };
    } catch (err) {
      this.logger.error(`Error encountered getting subscriber from notification service. ${err}`, {
        ...LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }

  async subscribe(tenantId: AdspId, formId: string, subscriber: Omit<Subscriber, 'urn'>): Promise<Subscriber> {
    try {
      const apiUrl = await this.directory.getServiceUrl(this.notificationApiId);
      const subscriptionUrl = new URL(`v1/types/form-status-updates/subscriptions?tenantId=${tenantId}`, apiUrl);

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ subscriber: Subscriber }>(
        subscriptionUrl.href,
        { ...subscriber, criteria: { correlationId: formId } },
        {
          headers: { Authorization: `Bearer ${token}` },
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

  async unsubscribe(tenantId: AdspId, urn: AdspId): Promise<boolean> {
    try {
      const subscriber = await this.getSubscriber(tenantId, urn);

      const apiUrl = await this.directory.getServiceUrl(this.notificationApiId);
      const subscriptionUrl = new URL(
        `v1/types/form-status-updates/subscriptions/${subscriber.id}?tenantId=${tenantId}`,
        apiUrl
      );

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.delete<{ deleted: boolean }>(subscriptionUrl.href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data.deleted;
    } catch (err) {
      this.logger.warn(`Error encountered unsubscribing for subscriber ${urn}. ${err}`, {
        ...LOG_CONTEXT,
        tenant: tenantId?.toString(),
      });
    }
  }

  async sendCode(tenantId: AdspId, subscriber: Subscriber): Promise<void> {
    try {
      const subscriberUrl = await this.directory.getResourceUrl(subscriber.urn);

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ sent: boolean }>(
        `${subscriberUrl.href}?tenantId=${tenantId}`,
        {
          operation: 'send-code',
          channel: Channel.email,
          address: subscriber.channels[0].address,
          reason: 'Enter this code to access your draft form.',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (data.sent) {
        this.logger.info(
          `Sent code to subscriber ${subscriber.addressAs} (User ID: ${subscriber.userId}) at ${subscriber.channels[0].address}`,
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

      const token = await this.tokenProvider.getAccessToken();
      const { data } = await axios.post<{ verified: boolean }>(
        `${subscriberUrl.href}?tenantId=${tenantId}`,
        {
          operation: 'check-code',
          channel: Channel.email,
          address: subscriber.channels[0].address,
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
      throw err;
    }
  }
}

export function createNotificationService(
  logger: Logger,
  directory: ServiceDirectory,
  tokenProvider: TokenProvider
): NotificationService {
  return new NotificationServiceImpl(logger, directory, tokenProvider);
}
