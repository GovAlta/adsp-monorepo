export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9-_ ]{1,50}$': {
      type: 'object',
      properties: {
        name: {
          type: 'string',
        },
        instructions: {
          type: 'string',
        },
        userRoles: {
          type: 'array',
          items: { type: 'string' },
        },
        tools: {
          type: 'array',
          items: { oneOf: [{ type: 'string' }, { type: 'object' }] },
        },
      },
      required: ['name', 'instructions'],
    },
  },
};
