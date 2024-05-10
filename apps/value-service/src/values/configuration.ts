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
            jsonSchema: { $ref: 'http://json-schema.org/draft-07/schema#' },
            sendWriteEvent: { type: 'boolean' },
          },
          required: ['name', 'description', 'jsonSchema'],
          additionalProperties: false,
        },
      },
    },
    required: ['name', 'definitions'],
  },
};
