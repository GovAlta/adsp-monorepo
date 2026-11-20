const idPattern = '^[a-zA-Z0-9-_]{1,50}$';
const requiredString = { type: 'string', minLength: 1 };

export const COLUMN_TYPES = ['text', 'multilineText', 'number', 'dateTime', 'boolean', 'multiChoice', 'hyperlink'];

const fieldMappings = {
  type: 'array',
  minItems: 1,
  items: {
    type: 'object',
    additionalProperties: false,
    required: ['source', 'target'],
    properties: {
      source: requiredString,
      target: requiredString,
      linkFormat: { type: 'string', enum: ['hyperlink', 'text'] },
      columnType: { type: 'string', enum: COLUMN_TYPES },
      displayName: requiredString,
      choices: { type: 'array', items: requiredString },
    },
  },
};

const detailList = {
  type: 'object',
  additionalProperties: false,
  required: ['dataPath', 'parentRefField', 'fieldMappings'],
  anyOf: [{ required: ['listId'] }, { required: ['listName'] }],
  properties: {
    listId: requiredString,
    listName: requiredString,
    dataPath: requiredString,
    parentRefField: requiredString,
    fieldMappings,
  },
};

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
          fieldMappings,
          idempotencyFields: { type: 'array', uniqueItems: true, items: requiredString },
          enabled: { type: 'boolean' },
          folderLinkField: requiredString,
          documentFilesLibraryId: requiredString,
          documentFilesLibraryName: requiredString,
          detailLists: { type: 'array', items: detailList },
        },
        // Detail rows are replaced by finding the main row, so it needs a row key.
        if: { required: ['detailLists'], properties: { detailLists: { type: 'array', minItems: 1 } } },
        then: { required: ['idempotencyFields'], properties: { idempotencyFields: { type: 'array', minItems: 1 } } },
      },
    },
  },
};
