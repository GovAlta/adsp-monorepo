export const CommentConfigurationSchema = {
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9-_ ]{1,50}$': {
      type: 'object',
      properties: {
        id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
        name: { type: 'string' },
        adminRoles: { type: 'array', items: { type: 'string' } },
        commenterRoles: { type: 'array', items: { type: 'string' } },
        readerRoles: { type: 'array', items: { type: 'string' } },
        securityClassification: {
          type: 'string',
          enum: ['public', 'protected a', 'protected b', 'protected c'],
          default: 'protected a',
        },
      },
      required: ['id', 'name', 'adminRoles', 'commenterRoles'],
    },
  },
};
