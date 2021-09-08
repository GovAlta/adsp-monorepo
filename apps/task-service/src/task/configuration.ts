export const configurationSchema = {
  type: 'object',
  properties: {
    definitions: {
      type: 'object',
    },
    queues: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        properties: {
          namespace: {
            type: 'string',
          },
          name: {
            type: 'string',
          },
          context: {
            type: 'object',
            additionalProperties: {
              oneOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
            },
          },
          assignerRoles: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          workerRoles: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
        },
        required: ['namespace', 'name', 'context', 'assignerRoles', 'workerRoles'],
      },
    },
  },
};
