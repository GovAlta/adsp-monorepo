export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9-]{1,50}(:[a-zA-Z0-9-]{1,50}$|$)': {
      type: 'object',
      properties: {
        description: {
          type: ['string', 'null'],
        },
        anonymousRead: {
          type: 'boolean',
          default: false,
        },
        configurationSchema: {
          $ref: 'http://json-schema.org/draft-07/schema#',
        },
      },
      required: ['configurationSchema'],
      additionalProperties: false,
    },
  },
  additionalProperties: false,
};
