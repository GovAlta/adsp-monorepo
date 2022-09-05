export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9-_ ]{1,50}$': {
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
        footer: { type: ['string', 'null'] },
        header: { type: ['string', 'null'] },
      },
      required: ['id', 'name', 'template'],
    },
  },
  additionalProperties: false,
};
