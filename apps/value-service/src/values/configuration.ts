export const configurationSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      name: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
      definitions: {
        type: 'object',
        additionalProperties: {
          type: 'object',
          properties: {
            name: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
            displayName: { type: 'string' },
            description: { type: 'string' },
            jsonSchema: { type: 'object' },
          },
          required: ['name', 'description', 'jsonSchema'],
          additionalProperties: false,
        },
      },
    },
    required: ['name', 'definitions'],
  },
};
