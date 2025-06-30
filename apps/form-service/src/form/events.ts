import { AdspId, DomainEvent, DomainEventDefinition, Stream, User } from '@abgov/adsp-service-sdk';
import { FormEntity, FormSubmissionEntity } from './model';
import { mapForm } from './mapper';
import { SUBMITTED_FORM } from './pdf';
import { FormServiceRoles } from './roles';
import { SUPPORT_COMMENT_TOPIC_TYPE_ID } from './comment';

export const FORM_CREATED = 'form-created';
export const FORM_DELETED = 'form-deleted';

export const FORM_LOCKED = 'form-locked';
export const FORM_UNLOCKED = 'form-unlocked';
export const FORM_SET_TO_DRAFT = 'form-to-draft';
export const FORM_SUBMITTED = 'form-submitted';
export const FORM_ARCHIVED = 'form-archived';

export const SUBMISSION_DISPOSITIONED = 'submission-dispositioned';
export const SUBMISSION_DELETED = 'submission-deleted';

const userInfoSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', examples: ['1c0fa56b-f818-4cc7-9254-7513aecb5d9f'] },
    name: { type: 'string', examples: ['A.N.Other'] },
  },
};

export const formSchema = {
  type: 'object',
  properties: {
    definition: {
      type: 'object',
      properties: {
        id: { type: 'string', examples: ['adsp-support-request'] },
        name: { type: 'string', examples: ['ADSP Support request'] },
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
      urn: { type: 'string' },
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
    metric: ['form-service', 'form-entry', 'definitionId'],
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
  description: 'Signalled when a form submission is dispositioned.',
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
    metric: ['form-service', 'submission-processing', 'definitionId'],
  },
};

export const SubmissionDeletedDefinition: DomainEventDefinition = {
  name: SUBMISSION_DELETED,
  description: 'Signalled when a form submission is deleted.',
  payloadSchema: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      urn: { type: 'string' },
      deletedBy: userInfoSchema,
    },
  },
};

function getCorrelationId(form: ReturnType<typeof mapForm>) {
  return form?.urn;
}

export function formCreated(apiId: AdspId, user: User, form: FormEntity, dryRun: boolean): DomainEvent {
  const formResponse = mapForm(apiId, form, dryRun);
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
      urn: formResponse.urn,
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
  submission?: FormSubmissionEntity,
  dryRun?: boolean
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
      dryRun: dryRun
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

export function submissionDispositioned(apiId: AdspId, user: User, submission: FormSubmissionEntity): DomainEvent {
  const form = submission.form;
  const formResponse = form ? mapForm(apiId, form) : null;
  return {
    name: SUBMISSION_DISPOSITIONED,
    timestamp: new Date(),
    tenantId: submission.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: submission.definition?.id,
    },
    payload: {
      form: formResponse,
      submission: {
        urn: `${apiId}:/submissions/${submission.id}`,
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

export function submissionDeleted(apiId: AdspId, user: User, submission: FormSubmissionEntity): DomainEvent {
  const form = submission.form;
  const formResponse = form ? mapForm(apiId, form) : null;
  return {
    name: SUBMISSION_DELETED,
    timestamp: new Date(),
    tenantId: submission.tenantId,
    correlationId: getCorrelationId(formResponse),
    context: {
      definitionId: submission.definition?.id,
    },
    payload: {
      urn: `${apiId}:/submissions/${submission.id}`,
      id: submission.id,
      deletedBy: {
        id: user.id,
        name: user.name,
      },
    },
  };
}

export const SubmittedFormPdfUpdatesStream: Stream = {
  id: 'submitted-form-pdf-updates',
  name: 'Submitted form PDF generation updates',
  description: 'Provides update events for submitted form PDF generation.',
  subscriberRoles: [
    `urn:ads:platform:form-service:${FormServiceRoles.Applicant}`,
    `urn:ads:platform:form-service:${FormServiceRoles.IntakeApp}`,
  ],
  publicSubscribe: false,
  events: [
    {
      namespace: 'pdf-service',
      name: 'pdf-generation-queued',
      criteria: {
        context: { templateId: SUBMITTED_FORM },
      },
      map: {
        timestamp: 'timestamp',
        jobId: 'payload.jobId',
        templateId: 'payload.templateId',
      },
    },
    {
      namespace: 'pdf-service',
      name: 'pdf-generated',
      criteria: {
        context: { templateId: SUBMITTED_FORM },
      },
      map: {
        timestamp: 'timestamp',
        jobId: 'payload.jobId',
        templateId: 'payload.templateId',
        file: 'payload.file',
      },
    },
    {
      namespace: 'pdf-service',
      name: 'pdf-generation-failed',
      criteria: {
        context: { templateId: SUBMITTED_FORM },
      },
      map: {
        timestamp: 'timestamp',
        jobId: 'payload.jobId',
        templateId: 'payload.templateId',
      },
    },
  ],
};

export const FormQuestionUpdatesStream: Stream = {
  id: 'form-questions-updates',
  name: 'Form questions topic updates',
  description: 'Provides update events on form questions topics.',
  subscriberRoles: [
    `urn:ads:platform:form-service:${FormServiceRoles.Admin}`,
    `urn:ads:platform:form-service:${FormServiceRoles.Applicant}`,
  ],
  publicSubscribe: false,
  events: [
    {
      namespace: 'comment-service',
      name: 'comment-created',
      criteria: {
        context: { topicTypeId: SUPPORT_COMMENT_TOPIC_TYPE_ID },
      },
      map: {
        timestamp: 'timestamp',
        topic: 'payload.topic',
        commentId: 'payload.comment.id',
      },
    },
    {
      namespace: 'comment-service',
      name: 'comment-updated',
      criteria: {
        context: { topicTypeId: SUPPORT_COMMENT_TOPIC_TYPE_ID },
      },
      map: {
        timestamp: 'timestamp',
        topic: 'payload.topic',
        commentId: 'payload.comment.id',
      },
    },
    {
      namespace: 'comment-service',
      name: 'comment-deleted',
      criteria: {
        context: { topicTypeId: SUPPORT_COMMENT_TOPIC_TYPE_ID },
      },
      map: {
        timestamp: 'timestamp',
        topic: 'payload.topic',
        commentId: 'payload.comment.id',
      },
    },
  ],
};
