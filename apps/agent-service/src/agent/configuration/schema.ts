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
          items: {
            oneOf: [
              {
                type: 'string',
              },
              {
                type: 'object',
                properties: {
                  id: {
                    type: 'string',
                    pattern: '^[a-zA-Z0-9-_ ]{1,50}$',
                  },
                  type: { type: 'string' },
                  description: { type: 'string' },
                  inputSchema: { type: 'object' },
                  outputSchema: { type: 'object' },
                  method: {
                    type: 'string',
                    enum: ['GET', 'POST', 'PUT'],
                  },
                  resource: { type: 'string' },
                  userContext: { type: 'boolean' },
                },
                required: ['id', 'description', 'type', 'inputSchema', 'outputSchema', 'method', 'resource'],
              },
            ],
          },
        },
      },
      required: ['name', 'instructions'],
    },
  },
};
