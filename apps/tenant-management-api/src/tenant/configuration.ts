export const configurationSchema = {
  type: 'object',
  additionalProperties: {
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
}
