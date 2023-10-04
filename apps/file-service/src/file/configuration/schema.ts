export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9-_ ]{1,50}$': {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
        name: { type: 'string' },
        anonymousRead: { type: 'boolean' },
        readRoles: { type: 'array', items: { type: 'string' } },
        updateRoles: { type: 'array', items: { type: 'string' } },
        securityClassification: { type: 'string' },
        rules: {
          type: ['object', 'null'],
          properties: {
            retention: {
              type: ['object', 'null'],
              properties: {
                createdAt: { type: 'string' },
                active: { type: 'boolean' },
                deleteInDays: { type: 'integer' },
              },
            },
          },
        },
      },
      required: ['id', 'name', 'anonymousRead', 'readRoles', 'updateRoles'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};
