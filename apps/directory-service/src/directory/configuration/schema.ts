export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^urn:ads:[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}$': {
      type: 'object',
      properties: {
        resourceTypes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              matcher: { type: 'string' },
              type: { type: 'string' },
              namePath: { type: 'string' },
              descriptionPath: { type: ['string', 'null'] },
              deleteEvent: {
                type: 'object',
                properties: {
                  namespace: { type: 'string' },
                  name: { type: 'string' },
                  resourceIdPath: { type: 'string' },
                },
                required: ['namespace', 'name', 'resourceIdPath'],
              },
            },
            required: ['matcher', 'type'],
          },
        },
      },
      required: ['resourceTypes'],
    },
  },
};
