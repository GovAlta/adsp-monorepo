export const configurationSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      anonymousRead: { type: 'boolean' },
      readRoles: { type: 'array', items: { type: 'string' } },
      updateRoles: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'name', 'anonymousRead', 'readRoles', 'updateRoles'],
    additionalProperties: false,
  },
};
