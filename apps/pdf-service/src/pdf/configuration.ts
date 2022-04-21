export const configurationSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        pattern: '^[a-zA-Z0-9-_ ]{1,50}$',
      },
      name: {
        type: 'string',
      },
      description: {
        type: 'string',
      },
      template: {
        type: 'string',
      },
    },
    required: ['id', 'name', 'template'],
  },
};

