export const calendarNamePattern = /^[a-zA-Z0-9-_ ]{1,50}$/;

export const configurationSchema = {
  type: 'object',
  patternProperties: {
    [calendarNamePattern.source]: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          pattern: calendarNamePattern.source,
        },
        displayName: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        readRoles: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
        updateRoles: {
          type: 'array',
          items: {
            type: 'string',
          },
        },
      },
      required: ['name', 'readRoles', 'updateRoles'],
    },
  },
  additionalProperties: false,
};
