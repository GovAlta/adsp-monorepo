export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9-_ ]{1,50}$': {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_ ]{1,50}$',
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
  },
  additionalProperties: false,
};
