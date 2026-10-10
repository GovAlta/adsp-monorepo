export const configurationSchema = {
  type: 'object',
  properties: {
    patterns: {
      type: 'object',
      description: 'Tenant-defined business patterns that extend or override the built-in catalog, keyed by pattern ID.',
      additionalProperties: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
          domainLanguage: { type: 'array', items: { type: 'string' } },
          strongSignals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
              },
              required: ['description', 'keywords'],
            },
          },
          weakSignals: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } },
              },
              required: ['description', 'keywords'],
            },
          },
          serviceMappings: {
            type: 'array',
            items: {
              type: 'object',
              properties: { service: { type: 'string' }, reason: { type: 'string' } },
              required: ['service', 'reason'],
            },
          },
          clarifyingQuestions: { type: 'array', items: { type: 'string' } },
          assumptions: { type: 'array', items: { type: 'string' } },
          knownUnknowns: { type: 'array', items: { type: 'string' } },
        },
        required: ['id', 'name', 'domainLanguage', 'strongSignals', 'serviceMappings'],
      },
    },
  },
};
