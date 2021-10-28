export const configurationSchema = {
  type: 'object',
  additionalProperties: {
    type: 'object',
    properties: {
      id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
      name: { type: 'string' },
      description: { type: 'string' },
      anonymousApply: { type: 'boolean' },
      applicantRoles: { type: 'array', items: { type: 'string' } },
      assessorRoles: { type: 'array', items: { type: 'string' } },
    },
    required: ['id', 'name', 'anonymousApply', 'applicantRoles', 'assessorRoles'],
  },
};
