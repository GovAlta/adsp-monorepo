export const configurationSchema = {
  type: 'object',
  additionalProperties: {
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
    },
    required: ['name', 'instructions'],
  },
};
