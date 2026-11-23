export const configurationSchema = {
  type: 'object',
  patternProperties: {
    '^[a-zA-Z0-9-_ ]{1,50}$': {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          pattern: '^[a-zA-Z0-9-_ ]{1,50}$',
        },
        name: {
          type: 'string',
        },
        description: {
          type: 'string',
        },
        template: {
          type: 'string',
        },
        footer: { type: ['string', 'null'] },
        header: { type: ['string', 'null'] },
        additionalStyles: { type: ['string', 'null'] },
        variables: { type: ['string', 'null'] },
        startWithDefault: { type: ['boolean'] },
      },
      required: ['id', 'name', 'template'],
    },
  },
  additionalProperties: false,
};

/**
 * Combines tenant and platform (core) templates. A platform template replaces a tenant template with the same ID.
 * The platform templates are returned as the second element, so that handlers can tell them apart.
 */
export function combinePdfConfiguration<T>(
  tenantConfig: Record<string, T>,
  coreConfig: Record<string, T>,
): [Record<string, T>, Record<string, T>] {
  return [{ ...tenantConfig, ...coreConfig }, coreConfig || {}];
}
