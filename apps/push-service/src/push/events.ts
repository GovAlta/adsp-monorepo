import type { AdspId, DomainEvent, DomainEventDefinition } from '@abgov/adsp-service-sdk';
import { DomainEvent as ReceivedDomainEvent } from '@core-services/core-common';
import { AxiosResponse } from 'axios';
import { AppStatusWebhook, Webhook } from './types';

export const webhookTriggered = (
  tenantId: AdspId,
  webhook: Webhook,
  triggerEvent: ReceivedDomainEvent,
  response: AxiosResponse,
  responseTime: number
): DomainEvent => ({
  name: 'webhook-triggered',
  timestamp: new Date(),
  tenantId,
  correlationId: triggerEvent.correlationId || webhook.id,
  context: {
    name: webhook.name,
  },
  payload: {
    webhook: {
      name: webhook.name,
      url: webhook.url,
      targetId: (webhook as AppStatusWebhook).targetId,
    },
    trigger: {
      namespace: triggerEvent.namespace,
      name: triggerEvent.name,
      correlationId: triggerEvent.correlationId,
      context: triggerEvent.context,
    },
    response: {
      status: response.statusText,
      statusCode: response.status,
      timestamp: response.headers?.date,
    },
    responseTime,
  },
});

export const WebhookTriggeredDefinition: DomainEventDefinition = {
  name: 'webhook-triggered',
  description: 'Signalled when a webhook is triggered.',
  payloadSchema: {
    type: 'object',
    properties: {
      webhook: {
        type: 'object',
        properties: {
          name: {
            type: 'string',
          },
          url: {
            type: 'string',
          },
          targetId: {
            type: ['string', 'null'],
          },
        },
      },
      trigger: {
        type: 'object',
        properties: {
          namespace: { type: 'string' },
          name: { type: 'string' },
          correlationId: { type: ['string', 'null'] },
          context: { type: ['object', 'null'] },
        },
      },
      response: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
          },
          statusCode: {
            type: 'number',
          },
          timestamp: {
            type: ['string', 'null'],
          },
        },
      },
      responseTime: {
        type: 'number',
      },
    },
    required: [],
  },
};
