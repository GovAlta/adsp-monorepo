export const configurationSchema = {
  type: 'object',
  properties: {
    targets: {
      type: 'object',
      patternProperties: {
        '^urn:ads:[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}(?::[a-zA-Z0-9-]{1,50})?$': {
          type: 'object',
          properties: {
            ttl: { type: 'number' },
            invalidationEvents: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  namespace: { type: 'string' },
                  name: { type: 'string' },
                  resourceIdPath: {
                    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
                  },
                },
                required: ['namespace', 'name', 'resourceIdPath'],
              },
            },
          },
          required: [],
        },
      },
    },
  },
  required: ['targets'],
};
