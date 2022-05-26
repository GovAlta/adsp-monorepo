export const configurationSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      name: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
      definitions: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            name: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
            description: { type: ['string', 'null'] },
            payloadSchema: { type: 'object' },
            interval: {
              type: 'object',
              properties: {
                namespace: { type: 'string' },
                name: { type: 'string' },
                metric: {
                  oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                },
                context: {
                  oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                },
              },
              required: ['namespace', 'name', 'metric'],
            },
            log: {
              type: 'object',
              properties: {
                skip: { type: 'boolean' },
              },
            },
          },
          required: ['name', 'description', 'payloadSchema'],
          additionalProperties: false,
        },
      },
    },
    required: ['name', 'definitions'],
    additionalProperties: false,
  },
};
