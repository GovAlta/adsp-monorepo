import { DomainEvent } from '@core-services/core-common';
import { AppStatusWebhook, Webhook, WebhookEvent } from '../types';
import axios, { AxiosResponse } from 'axios';
import { Logger } from 'winston';
import { getCircularReplacer, isValidUrl } from './utils';

export class WebhookEntity implements Webhook {
  id: string;
  url: string;
  name: string;
  description: string;
  events: WebhookEvent[];

  constructor(private logger: Logger, webhook: Webhook) {
    this.id = webhook.id;
    this.url = webhook.url;
    this.name = webhook.name;
    this.description = webhook.description;
    this.events = webhook.events;
  }

  async process(event: DomainEvent): Promise<AxiosResponse> {
    this.logger.debug(
      `Processing event ${event.namespace}:${event.name} for webhook ${this.name} (ID: ${this.id})...`,
      { context: 'WebHookEntity', tenant: event.tenantId?.toString() }
    );

    if (this.shouldTrigger(event) && isValidUrl(this.url)) {
      this.logger.debug(
        `Triggering webhook ${this.name} (ID: ${this.id}) for event ${event.namespace}:${event.name}...`,
        { context: 'WebHookEntity', tenant: event.tenantId?.toString() }
      );
      return await this.callWebhook(event);
    }
  }

  shouldTrigger({ namespace, name, correlationId, context }: DomainEvent): boolean {
    return !!this.events.find(
      (event) =>
        namespace === event.namespace &&
        name === event.name &&
        (!event.criteria?.correlationId || event.criteria.correlationId === correlationId) &&
        (!event.criteria?.context ||
          !Object.entries(event.criteria.context).find(([key, value]) => context?.[key] !== value))
    );
  }

  async callWebhook(event: DomainEvent) {
    try {
      const response = await axios.post(this.url, event);
      this.logger.info(`Triggered webhook ${this.name} (ID: ${this.id}) for event ${event.namespace}:${event.name}.`, {
        context: 'WebHookEntity',
        tenant: event.tenantId?.toString(),
      });

      return response;
    } catch (err) {
      this.logger.warn(`Webhook request failed with error: ${JSON.stringify(err.message, getCircularReplacer())}`, {
        context: 'WebHookEntity',
        tenant: event.tenantId?.toString(),
      });
      return axios.isAxiosError(err) ? err.response : null;
    }
  }
}

interface AppStatusEventPayload {
  application: { appKey?: string; id?: string };
}
/**
 * Entity that represents a webhook on application status up / down events.
 *
 * @export
 * @class AppStatusWebhookEntity
 * @extends {WebhookEntity}
 * @implements {AppStatusWebhook}
 */
export class AppStatusWebhookEntity extends WebhookEntity implements AppStatusWebhook {
  targetId: string;
  intervalMinutes: number;
  generatedByTest: boolean;
  eventTypes: { id: string }[];

  constructor(logger: Logger, webhook: AppStatusWebhook) {
    super(logger, webhook);
    this.targetId = webhook.targetId;
    this.intervalMinutes = webhook.intervalMinutes;
    this.generatedByTest = webhook.generatedByTest;
    this.eventTypes = webhook.eventTypes || [];
  }

  override shouldTrigger({ namespace, name, payload: rawPayload }: DomainEvent): boolean {
    // TODO: This is hardcoding a specific payload of the application status events.
    const payload = rawPayload as unknown as AppStatusEventPayload;

    return !!this.eventTypes.find(
      (eventType) =>
        `${namespace}:${name}` === eventType.id &&
        this.targetId &&
        (payload?.application?.appKey === this.targetId || payload?.application?.id === this.targetId)
    );
  }
}
