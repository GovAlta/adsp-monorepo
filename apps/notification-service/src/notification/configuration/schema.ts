import { NotificationType } from '../types';

const templateSchema = {
  type: 'object',
  properties: {
    subject: { type: 'string' },
    body: { type: 'string' },
  },
  required: ['subject', 'body'],
};

export const configurationSchema = {
  type: 'object',
  properties: {
    contact: {
      type: 'object',
      properties: {
        contactEmail: { type: 'string' },
        phoneNumber: { type: 'string' },
        supportInstructions: { type: 'string' },
      },
    },
  },
  additionalProperties: {
    type: 'object',
    properties: {
      id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
      name: { type: 'string' },
      description: { type: ['string', 'null'] },
      publicSubscribe: { type: 'boolean' },
      subscriberRoles: {
        type: 'array',
        items: { type: 'string' },
      },
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            namespace: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
            name: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
            templates: {
              type: 'object',
              properties: {
                email: templateSchema,
                sms: templateSchema,
                mail: templateSchema,
                slack: templateSchema,
              },
            },
            channels: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['email', 'sms', 'mail', 'slack'],
              },
            },
          },
          required: ['namespace', 'name', 'templates', 'channels'],
        },
      },
    },
    required: ['id', 'name', 'publicSubscribe', 'subscriberRoles', 'events'],
  },
};

export interface SupportContact {
  contactEmail: string;
  phoneNumber: string;
  supportInstructions: string;
}

export type Configuration = {
  contact?: SupportContact;
} & Record<string, NotificationType>;
