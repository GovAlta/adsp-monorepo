import { AdspId, DomainEvent, DomainEventDefinition, User } from '@abgov/adsp-service-sdk';
import { FormEntity, FormSubmissionEntity } from './model';
import { FormResponse, mapForm } from './mapper';

export const FORM_CREATED = 'form-created';
export const FORM_DELETED = 'form-deleted';

export const FORM_LOCKED = 'form-locked';
export const FORM_UNLOCKED = 'form-unlocked';
export const FORM_SET_TO_DRAFT = 'form-to-draft';
export const FORM_SUBMITTED = 'form-submitted';
export const FORM_ARCHIVED = 'form-archived';
export const SUBMISSION_DISPOSITIONED = 'submission-dispositioned';

const userInfoSchema = {
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
  },
};

const formSchema = {
  type: 'object',
  properties: {
    definition: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
    },
    id: { type: 'string' },
    securityClassification: {
      type: ['string', 'null'],
      enum: [
        'public',
        'protected a',
        'protected b',
        'protected c',
        '', //The empty string is to handle old file types that do not have a security classification
        null,
      ],
      default: 'protected b',
    },
    formDraftUrl: { type: 'string' },
    status: { type: 'string' },
    created: { type: 'string', format: 'date-time' },
    locked: { oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
    submitted: { oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }] },
    lastAccessed: { type: 'string', format: 'date-time' },
  },
};

export const FormCreatedDefinition: DomainEventDefinition = {
  name: FORM_CREATED,
  description: 'Signalled when a form is created.',
  payloadSchema: {
    type: 'object',
    properties: {
      form: formSchema,
      createdBy: userInfoSchema,
    },
  },
};

export const FormDeletedDefinition: DomainEventDefinition = {
  name: FORM_DELETED,
  description: 'Signalled when a form is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      deletedBy: userInfoSchema,
    },
  },
};

export const FormStatusLockedDefinition: DomainEventDefinition = {
  name: FORM_LOCKED,
  description: 'Signalled when a draft form is locked because it has not been accessed.',
  payloadSchema: {
    type: 'object',
    properties: {
      form: formSchema,
      lockedBy: userInfoSchema,
      deleteOn: { type: 'string', format: 'date-time' },
    },
  },
};

export const FormStatusUnlockedDefinition: DomainEventDefinition = {
  name: FORM_UNLOCKED,
  description: 'Signalled when a draft form is unlocked by an administrator.',
  payloadSchema: {
    type: 'object',
    properties: {
      form: formSchema,
      unlockedBy: userInfoSchema,
    },
  },
};

export const FormStatusSubmittedDefinition: DomainEventDefinition = {
  name: FORM_SUBMITTED,
  description: 'Signalled when a form is submitted.',
  payloadSchema: {
    type: 'object',
    properties: {
      form: formSchema,
      submittedBy: userInfoSchema,
      submission: {
        type: ['object', 'null'],
        properties: {
          id: { type: 'string' },
        },
      },
    },
  },
  interval: {
    namespace: 'form-service',
    name: FORM_CREATED,
    metric: ['form-service', 'form-entry'],
  },
};

export const FormStatusSetToDraftDefinition: DomainEventDefinition = {
  name: FORM_SET_TO_DRAFT,
  description: 'Signalled when a form is set back to draft.',
  payloadSchema: {
    type: 'object',
    properties: {
      form: formSchema,
      submittedBy: userInfoSchema,
    },
  },
};

export const FormStatusArchivedDefinition: DomainEventDefinition = {
  name: FORM_ARCHIVED,
  description: 'Signalled when a form is archived.',
  payloadSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      archivedBy: userInfoSchema,
    },
  },
};

export const SubmissionDispositionedDefinition: DomainEventDefinition = {
  name: SUBMISSION_DISPOSITIONED,
  description: 'Signalled when a form submission is dispositioned',
  payloadSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      form: formSchema,
      submission: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          createdBy: userInfoSchema,
          disposition: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              reason: { type: 'string' },
            },
          },
        },
      },
    },
  },
  interval: {
    namespace: 'form-service',
    name: FORM_SUBMITTED,
    metric: ['form-service', 'submission-processing'],
  },
};

function getCorrelationId(form: FormResponse) {
  return form.urn;
}

export function formCreated(apiId: AdspId, user: User, form: FormEntity): DomainEvent {
  const formResponse = mapForm(apiId, form);
  return {
    name: FORM_CREATED,
    timestamp: form.created,
    tenantId: form.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: form.definition.id,
    },
    payload: {
      form: formResponse,
      createdBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function formDeleted(apiId: AdspId, user: User, form: FormEntity): DomainEvent {
  const formResponse = mapForm(apiId, form);
  return {
    name: FORM_DELETED,
    timestamp: new Date(),
    tenantId: form.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: form.definition.id,
    },
    payload: {
      id: form.id,
      deletedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function formLocked(apiId: AdspId, user: User, form: FormEntity, deleteOn: Date): DomainEvent {
  const formResponse = mapForm(apiId, form);
  return {
    name: FORM_LOCKED,
    timestamp: form.locked,
    tenantId: form.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: form.definition.id,
    },
    payload: {
      form: formResponse,
      lockedBy: {
        id: user.id,
        name: user.name,
      },
      deleteOn,
    },
  };
}

export function formUnlocked(apiId: AdspId, user: User, form: FormEntity): DomainEvent {
  const formResponse = mapForm(apiId, form);
  return {
    name: FORM_UNLOCKED,
    timestamp: new Date(),
    tenantId: form.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: form.definition.id,
    },
    payload: {
      form: formResponse,
      unlockedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function formSetToDraft(apiId: AdspId, user: User, form: FormEntity): DomainEvent {
  const formResponse = mapForm(apiId, form);
  return {
    name: FORM_SET_TO_DRAFT,
    timestamp: new Date(),
    tenantId: form.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: form.definition.id,
    },
    payload: {
      form: formResponse,
      toDraftBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function formSubmitted(
  apiId: AdspId,
  user: User,
  form: FormEntity,
  submission?: FormSubmissionEntity
): DomainEvent {
  const formResponse = mapForm(apiId, form);
  return {
    name: FORM_SUBMITTED,
    timestamp: form.submitted,
    tenantId: form.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: form.definition.id,
    },
    payload: {
      form: formResponse,
      submission: submission
        ? {
            urn: `${formResponse.urn}/submissions/${submission.id}`,
            id: submission.id,
            createdBy: {
              id: submission.createdBy.id,
              name: submission.createdBy.name,
            },
          }
        : null,
      submittedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function formArchived(apiId: AdspId, user: User, form: FormEntity): DomainEvent {
  const formResponse = mapForm(apiId, form);
  return {
    name: FORM_ARCHIVED,
    timestamp: new Date(),
    tenantId: form.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: form.definition.id,
    },
    payload: {
      id: form.id,
      archivedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export function submissionDispositioned(
  apiId: AdspId,
  user: User,
  form: FormEntity,
  submission: FormSubmissionEntity
): DomainEvent {
  const formResponse = mapForm(apiId, form);
  return {
    name: SUBMISSION_DISPOSITIONED,
    timestamp: new Date(),
    tenantId: form.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: form.definition.id,
    },
    payload: {
      form: formResponse,
      submission: {
        urn: `${formResponse.urn}/submissions/${submission.id}`,
        id: submission.id,
        disposition: {
          createdBy: {
            id: user.id,
            name: user.name,
          },
          status: submission.disposition.status,
          reason: submission.disposition.reason,
        },
      },
    },
  };
}
