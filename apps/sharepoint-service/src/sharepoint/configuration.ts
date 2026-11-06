const idPattern = '^[a-zA-Z0-9-_]{1,50}$';
const requiredString = { type: 'string', minLength: 1 };

// The root allows other keys: dev tenants may hold legacy alpha documents keyed by connection ID,
// and Configuration Service validates the whole merged document on UPDATE.
export const configurationSchema = {
  type: 'object',
  properties: {
    connections: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'entraTenantId', 'clientId', 'siteId'],
        properties: {
          id: { type: 'string', pattern: idPattern },
          name: requiredString,
          entraTenantId: requiredString,
          clientId: requiredString,
          siteId: requiredString,
        },
      },
    },
    destinations: {
      type: 'object',
      additionalProperties: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'name', 'connectionId', 'listId', 'fieldMappings'],
        properties: {
          id: { type: 'string', pattern: idPattern },
          name: requiredString,
          connectionId: { type: 'string', pattern: idPattern },
          listId: requiredString,
          fieldMappings: {
            type: 'array',
            minItems: 1,
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['source', 'target'],
              properties: { source: requiredString, target: requiredString },
            },
          },
          idempotencyFields: { type: 'array', uniqueItems: true, items: requiredString },
          enabled: { type: 'boolean' },
        },
      },
    },
  },
};
