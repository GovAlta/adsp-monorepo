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
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string' },
      subscriberRoles: {
        type: 'array',
        items: { type: 'string' },
      },
      events: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            namespace: { type: 'string' },
            name: { type: 'string' },
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
    required: ['id', 'name', 'subscriberRoles', 'events'],
  },
};
