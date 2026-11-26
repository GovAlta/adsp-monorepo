export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^urn:ads:[a-zA-Z0-9-]{1,50}:[a-zA-Z0-9-]{1,50}$': {
      type: 'object',
      properties: {
        roles: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              role: {
                type: 'string',
              },
              description: {
                type: 'string',
              },
              inTenantAdmin: {
                type: 'boolean',
              },
            },
            required: ['role'],
            additionalProperties: false,
          },
        },
      },
      required: ['roles'],
      additionalProperties: false,
    },
  },
  properties: {
    // Client secret rotation settings of the realm, written by tenant admins through the rotation API.
    realmMode: { type: 'string', enum: ['off', 'selected'] },
    noticePeriod: { type: 'number', minimum: 1 },
  },
  additionalProperties: false,
};
