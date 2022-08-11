export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^urn:ads:[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}$': {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              inTenantAdmin: {
                type: 'boolean',
              },
            },
            required: ['role'],
            additionalProperties: false,
          },
        },
      },
      required: ['roles'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};
