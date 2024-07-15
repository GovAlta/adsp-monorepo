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
          },
          required: [],
        },
      },
    },
  },
  required: ['targets'],
};
