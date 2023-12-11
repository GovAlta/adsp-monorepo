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
            name: { type: 'string' },
            description: { type: ['string', 'null'] },
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
            disableVerifyHost: { type: ['boolean', 'null'] },
            successRedirectUrl: { type: ['string', 'null'] },
            failureRedirectUrl: { type: ['string', 'null'] },
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
                  additionalProperties: false,
                },
              },
            },
          },
          required: ['id', 'name', 'authCallbackUrl'],
          additionalProperties: false,
        },
      },
    },
  },
};
