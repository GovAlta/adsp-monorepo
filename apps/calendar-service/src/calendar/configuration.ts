export const configurationSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      name: {
        type: 'string',
      },
      displayName: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      readRoles: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
      updateRoles: {
        type: 'array',
        items: {
          type: 'string',
        },
      },
    },
    required: ['name', 'readRoles', 'updateRoles'],
  },
};
