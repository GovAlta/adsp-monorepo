import { Channel, NotificationType } from '../types';

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
        supportInstructions: { type: 'string' },
      },
    },
    email: {
      type: 'object',
      properties: {
        fromEmail: { type: 'string' },
      },
    },
  },
  patternProperties: {
    '^(?!email|contact)[a-zA-Z0-9-_ ]{1,50}$': {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
        name: { type: 'string' },
        description: { type: ['string', 'null'] },
        publicSubscribe: { type: 'boolean' },
        manageSubscribe: { type: 'boolean' },
        address: { type: ['string', 'null'] },
        addressPath: { type: ['string', 'null'] },
        channels: {
          type: 'array',
          items: {
            type: 'string',
            enum: Object.values(Channel),
          },
        },
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
                  bot: templateSchema,
                },
              },
            },
            required: ['namespace', 'name', 'templates'],
          },
        },
      },
      required: ['id', 'name', 'publicSubscribe', 'subscriberRoles', 'events'],
    },
  },

  additionalProperties: false,
};

export interface SupportContact {
  contactEmail: string;
  phoneNumber: string;
  supportInstructions: string;
}

export interface FromEmail {
  fromEmail: string;
}

export type Configuration = {
  contact?: SupportContact;
  email?: FromEmail;
} & Record<string, NotificationType>;
