export const configurationSchema = {
  type: 'object',
  properties: {
    clients: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9-_ ]{1,50}$': {
          type: 'object',
          properties: {
            id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
            authCallbackUrl: { type: 'string' },
            prompt: {
              type: ['string', 'null'],
              enum: ['none', 'login', 'consent', 'select_account', null],
            },
            scope: {
              type: ['array', 'string', 'null'],
              items: { type: 'string' },
            },
            idpHint: { type: ['string', 'null'] },
            successRedirectUrl: { type: ['string', 'null'] },
            failureRedirectUrl: { type: ['string', 'null'] },
          },
          required: ['id', 'authCallbackUrl'],
        },
      },
    },
    targets: {
      type: 'object',
      patternProperties: {
        '^[a-zA-Z0-9-_ ]{1,50}$': {
          type: 'object',
          properties: {
            id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
            upstream: { type: 'string' },
          },
          required: ['id', 'upstream'],
        },
      },
    },
  },
};
