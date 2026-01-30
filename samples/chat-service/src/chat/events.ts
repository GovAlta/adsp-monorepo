import {
  DomainEvent,
  DomainEventDefinition,
  User,
} from '@abgov/adsp-service-sdk';
import * as hasha from 'hasha';

export const MessageSentEventDefinition: DomainEventDefinition = {
  name: 'message-sent',
  description: 'Signalled when a new message is sent.',
  payloadSchema: {
    type: 'object',
    properties: {
      hash: {
        type: 'string',
      },
      timestamp: {
        type: 'string',
        format: 'date-time',
      },
      room: {
        type: 'string',
      },
      message: {
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'object',
            properties: {
              urn: { type: 'string' },
            },
          },
          {
            type: 'array',
            items: {
              oneOf: [
                {
                  type: 'string',
                },
                {
                  type: 'object',
                  properties: {
                    urn: { type: 'string' },
                  },
                },
              ],
            },
          },
        ],
      },
      from: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
        },
      },
    },
  },
};

export const messageSent = (
  user: User,
  room: string,
  message: string
): DomainEvent => {
  const timestamp = new Date();
  const payload = {
    timestamp,
    room,
    message,
    from: {
      id: user.id,
      name: user.name,
    },
  };

  // The message has no 'identity' per se, so the hash provides uniqueness.
  return {
    name: 'message-sent',
    timestamp,
    correlationId: room,
    context: {
      roomId: room,
      fromUserId: user.id,
    },
    payload: {
      ...payload,
      hash: hasha(JSON.stringify({ payload }), { algorithm: 'sha1' }),
    },
  };
};
