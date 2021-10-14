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
              },
            },
            channels: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['email', 'sms', 'mail'],
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
