export const configurationSchema = {
  type: 'object',
  properties: {
    sources: {
      type: 'object',
      patternProperties: {
        '^urn:ads:[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}(?::[a-zA-Z0-9-]{1,50})?$': {
          type: 'object',
          properties: {
            exporterRoles: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['exporterRoles'],
        },
      },
    },
  },
  required: ['sources'],
};
