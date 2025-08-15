export const configurationSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', pattern: '^[a-zA-Z0-9-_ ]{1,50}$' },
    name: { type: 'string' },
    description: { type: 'string' },
    formDraftUrlTemplate: { type: 'string', pattern: '^http[s]?://.{0,500}$' },
    anonymousApply: { type: 'boolean' },
    oneFormPerApplicant: { type: 'boolean', default: true },
    applicantRoles: { type: 'array', items: { type: 'string' } },
    assessorRoles: { type: 'array', items: { type: 'string' } },
    clerkRoles: { type: 'array', items: { type: 'string' } },
    dataSchema: { $ref: 'http://json-schema.org/draft-07/schema#' },
    uiSchema: { type: 'object' },
    ministry: {
      type: 'string',
    },
    securityClassification: {
      type: 'string',
      enum: ['public', 'protected a', 'protected b', 'protected c'],
      default: 'protected a',
    },
    dispositionStates: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          description: { type: 'string' },
        },
        required: ['id', 'name'],
      },
    },
    queueTaskToProcess: {
      type: 'object',
      properties: { queueNameSpace: { type: 'string' }, queueName: { type: 'string' } },
    },
    submissionRecords: { type: 'boolean' },
    supportTopic: { type: 'boolean' },
    submissionPdfTemplate: { type: 'string' },
    scheduledIntakes: { type: 'boolean' },
    registeredId: { type: 'string' },
  },
  required: ['id', 'name', 'anonymousApply', 'applicantRoles', 'assessorRoles'],
};
