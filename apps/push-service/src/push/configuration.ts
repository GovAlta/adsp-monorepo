import { AdspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { AppStatusWebhookEntity, StreamEntity, WebhookEntity } from './model';
import { isAppStatusWebhook, Stream, Webhook } from './types';

export const configurationSchema = {
  type: 'object',
  properties: {
    webhooks: {
      type: ['object', 'null'], // Null is allowed for backwards compatibility
      patternProperties: {
        '^[a-zA-Z0-9-_ ]{1,50}$': {
          type: ['object', 'null'], // Null is allowed for backwards compatibility
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
            url: { type: 'string' },
            events: {
              type: ['array', 'null'],
              items: {
                type: 'object',
                properties: {
                  namespace: { type: 'string' },
                  name: { type: 'string' },
                  map: {
                    type: 'object',
                    additionalProperties: {
                      type: 'string',
                    },
                  },
                  criteria: {
                    type: 'object',
                    properties: {
                      correlationId: { type: 'string' },
                      context: {
                        type: 'object',
                        additionalProperties: true,
                      },
                    },
                  },
                },
                required: ['namespace', 'name'],
              },
            },
            targetId: { type: 'string' },
            intervalMinutes: { type: 'number' },
            eventTypes: {
              type: ['array', 'null'],
              items: {
                type: 'object',
                properties: { id: { type: 'string' } },
                required: ['id'],
              },
            },
          },
          required: ['id', 'name', 'url'],
        },
      },
    },
  },
  additionalProperties: {
    type: 'object',
    properties: {
      id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
      name: { type: 'string' },
      description: { type: ['string', 'null'] },
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            namespace: { type: 'string' },
            name: { type: 'string' },
            map: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              },
            },
            criteria: {
              type: 'object',
              properties: {
                correlationId: { type: 'string' },
                context: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
            },
          },
          required: ['namespace', 'name'],
        },
      },
      subscriberRoles: { type: 'array', items: { type: 'string' } },
      publicSubscribe: { type: 'boolean' },
    },
    required: ['id', 'name'],
  },
};

export type PushServiceConfiguration = Record<string, Stream> & { webhooks: Record<string, Webhook> | null };

export const combinePushConfiguration = (
  tenant: PushServiceConfiguration,
  core: PushServiceConfiguration,
  tenantId: AdspId,
  logger: Logger,
) =>
  Object.entries({ ...tenant, ...core }).reduce((configuration, [key, value]) => {
    if (key === 'webhooks') {
      const webhooks = Object.entries((value as Record<string, Webhook> | null) || {})
        .filter(([_webhookKey, webhook]) => webhook)
        .reduce(
          (result, [webhookKey, webhook]) => ({
            ...result,
            [webhookKey]: isAppStatusWebhook(webhook)
              ? new AppStatusWebhookEntity(logger, webhook)
              : new WebhookEntity(logger, webhook),
          }),
          {} as Record<string, WebhookEntity>,
        );
      return { ...configuration, webhooks };
    }
    return { ...configuration, [key]: new StreamEntity(logger, tenantId, value as Stream) };
  }, {});
