import {
  AdspId,
  DomainEvent,
  EventService,
  isAllowedUser,
  startBenchmark,
  UnauthorizedUserError,
  GoAError,
  TenantService,
} from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
} from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { body, checkSchema, param, query } from 'express-validator';
import validator from 'validator';
import { FileService } from '../../file';
import { NotificationService } from '../../notification';
import { QueueTaskService } from '../../task';
import { CommentService } from '../comment';
import {
  formArchived,
  formCreated,
  formDeleted,
  formSetToDraft,
  formSubmitted,
  formUnlocked,
  submissionDispositioned,
} from '../events';
import { mapForm, mapFormDefinition } from '../mapper';
import { FormDefinitionEntity, FormEntity, FormSubmissionEntity } from '../model';
import { FormRepository, FormSubmissionRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { Form, FormCriteria, FormSubmission, FormSubmissionCriteria } from '../types';
import {
  ARCHIVE_FORM_OPERATION,
  FormOperations,
  SEND_CODE_OPERATION,
  SUBMIT_FORM_OPERATION,
  UNLOCK_FORM_OPERATION,
  SET_TO_DRAFT_FORM_OPERATION,
} from './types';
import { PdfService } from '../pdf';

export function mapFormData(entity: FormEntity): Pick<Form, 'id' | 'data' | 'files'> {
  return {
    id: entity.id,
    data: entity.data,
    files: Object.entries(entity.files || {}).reduce((f, [k, v]) => ({ ...f, [k]: v?.toString() }), {}),
  };
}

export function mapFormSubmissionData(apiId: AdspId, entity: FormSubmissionEntity): FormSubmission & { urn: string } {
  return {
    urn: `${apiId}:/forms/${entity.formId}/submissions/${entity.id}`,
    id: entity.id,
    formId: entity.formId,
    formDefinitionId: entity.formDefinitionId,
    formData: entity.formData,
    formFiles: Object.entries(entity.formFiles || {}).reduce((f, [k, v]) => ({ ...f, [k]: v?.toString() }), {}),
    created: entity.created,
    createdBy: { id: entity.createdBy.id, name: entity.createdBy.name },
    securityClassification: entity?.securityClassification,
    disposition: entity.disposition
      ? {
          id: entity.disposition.id,
          date: entity.disposition.date,
          status: entity.disposition.status,
          reason: entity.disposition.reason,
        }
      : null,
    updated: entity.updated,
    updatedBy: { id: entity.updatedBy.id, name: entity.updatedBy.name },
    hash: entity.hash,
  };
}

export const getFormDefinitions: RequestHandler = async (req, res, next) => {
  try {
    throw new GoAError('Definitions endpoint no longer supported.', { statusCode: 410 });
  } catch (err) {
    next(err);
  }
};

async function getDefinitionFromConfiguration(req: Request, definitionId: string): Promise<FormDefinitionEntity> {
  const [definition] = await req.getServiceConfiguration<FormDefinitionEntity>(definitionId);

  if (!definition) {
    throw new NotFoundError('form definition', definitionId);
  }

  return definition;
}

export function getFormDefinition(tenantService: TenantService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { definitionId } = req.params;

      // This endpoint allows anonymous requests and needs to support resolving tenant context via a query param in that case.
      if (!req.tenant) {
        const { tenantId: tenantIdValue } = req.query;
        const tenantId = tenantIdValue ? AdspId.parse(tenantIdValue as string) : null;
        req.tenant = tenantId ? await tenantService.getTenant(tenantId) : null;
      }

      if (!req.tenant) {
        throw new InvalidOperationError('Cannot determine tenant context of request.');
      }

      const definition = await getDefinitionFromConfiguration(req, definitionId);

      if (!definition.canAccessDefinition(user)) {
        throw new UnauthorizedUserError('access definition', user);
      }

      res.send(mapFormDefinition(definition));
    } catch (err) {
      next(err);
    }
  };
}

export function findForms(apiId: AdspId, repository: FormRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria: FormCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      if (!isAllowedUser(user, req.tenant.id, FormServiceRoles.Admin, true)) {
        // If user is not a form service admin, then limit search to only forms created by the user.
        criteria.createdByIdEquals = user.id;
      }

      if (user.tenantId) {
        criteria.tenantIdEquals = user.tenantId;
      }

      const { results, page } = await repository.find(top, after as string, criteria);

      end();
      res.send({
        results: results.filter((r) => r.canRead(user)).map((r) => mapForm(apiId, r)),
        page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function findFormSubmissions(
  apiId: AdspId,
  repository: FormSubmissionRepository,
  formRepository: FormRepository
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const tenantId = req.tenant.id;
      const { formId } = req.params;
      const { criteria: criteriaValue } = req.query;
      const criteria: FormSubmissionCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      const formEntity: FormEntity = await formRepository.get(tenantId, formId);
      const definition = formEntity?.definition;

      if (!isAllowedUser(user, tenantId, [FormServiceRoles.Admin, ...(definition?.assessorRoles || [])])) {
        throw new UnauthorizedUserError('find form submissions', user);
      }

      const { results, page } = await repository.find({
        ...criteria,
        tenantIdEquals: tenantId,
        formIdEquals: formId,
      });

      end();
      res.send({
        results: results.map((r) => mapFormSubmissionData(apiId, r)),
        page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function createForm(
  apiId: AdspId,
  repository: FormRepository,
  submissionRepository: FormSubmissionRepository,
  eventService: EventService,
  commentService: CommentService,
  notificationService: NotificationService,
  queueTaskService: QueueTaskService,
  pdfService: PdfService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const { definitionId, applicant: applicantInfo, data, files: fileIds, submit } = req.body;

      const events: DomainEvent[] = [];
      const definition = await getDefinitionFromConfiguration(req, definitionId);
      let form = await definition.createForm(user, repository, notificationService, applicantInfo);
      events.push(formCreated(apiId, user, form));

      // If data or files is set, then update the form.
      if (data || fileIds) {
        const files: Record<string, AdspId> = fileIds
          ? Object.entries(fileIds).reduce((ids, [k, v]) => ({ ...ids, [k]: AdspId.parse(v as string) }), {})
          : null;

        form = await form.update(user, data, files);
      }

      // If submit is true, then immediately submit the form.
      if (submit === true) {
        const [submittedForm, submission] = await form.submit(user, queueTaskService, submissionRepository, pdfService);
        form = submittedForm;

        events.push(formSubmitted(apiId, user, form, submission));
      }
      const result = mapForm(apiId, form);
      res.send(result);

      for (const event of events) {
        eventService.send(event);
      }

      if (definition.supportTopic) {
        commentService.createSupportTopic(form, result.urn);
      }

      end();
    } catch (err) {
      next(err);
    }
  };
}

const FORM = 'form';
export function getForm(repository: FormRepository): RequestHandler {
  return async (req, _res, next) => {
    try {
      const end = startBenchmark(req, 'get-entity-time');
      const user = req.user;
      const { formId } = req.params;

      const form = await repository.get(req.tenant.id, formId);
      if (!form) {
        throw new NotFoundError('form', formId);
      }

      if (!form.canRead(user)) {
        throw new UnauthorizedUserError('get form', user);
      }

      req[FORM] = form;

      end();
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function getFormSubmission(apiId: AdspId, submissionRepository: FormSubmissionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'get-entity-time');
      const { formId, submissionId } = req.params;
      const user = req.user;

      const formSubmission = await submissionRepository.getByFormIdAndSubmissionId(req.tenant.id, submissionId, formId);
      if (!formSubmission) {
        throw new NotFoundError('Form Submission', submissionId);
      }

      if (!formSubmission.canRead(user)) {
        throw new UnauthorizedUserError('get form submission', user);
      }

      end();
      res.send(mapFormSubmissionData(apiId, formSubmission));
    } catch (err) {
      next(err);
    }
  };
}

export function updateFormSubmissionDisposition(
  apiId: AdspId,
  eventService: EventService,
  repository: FormRepository,
  submissionRepository: FormSubmissionRepository
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');
      const user = req.user;
      const { formId, submissionId } = req.params;
      const { dispositionStatus, dispositionReason } = req.body;

      const formSubmission = await submissionRepository.getByFormIdAndSubmissionId(req.tenant.id, submissionId, formId);
      if (!formSubmission) {
        throw new NotFoundError('Form submission', submissionId);
      }

      const updated = await formSubmission.dispositionSubmission(user, dispositionStatus, dispositionReason);
      const form = await repository.get(req.tenant.id, formId);
      end();

      res.send(mapFormSubmissionData(apiId, updated));
      eventService.send(submissionDispositioned(apiId, user, form, updated));
    } catch (err) {
      next(err);
    }
  };
}

export function accessForm(notificationService: NotificationService): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const { code } = req.query;
      const form: FormEntity = req[FORM];

      const result = await (code
        ? form.accessByCode(user, notificationService, code as string)
        : form.accessByUser(user));

      end();
      res.send(mapFormData(result));
    } catch (err) {
      next(err);
    }
  };
}

export const updateFormData: RequestHandler = async (req, res, next) => {
  try {
    const end = startBenchmark(req, 'operation-handler-time');

    const user = req.user;
    const form: FormEntity = req[FORM];
    const { data, files: fileIds } = req.body;
    const files: Record<string, AdspId> = fileIds
      ? Object.entries(fileIds).reduce((ids, [k, v]) => ({ ...ids, [k]: AdspId.parse(v as string) }), {})
      : null;

    const result = await form.update(user, data, files);

    end();
    res.send(mapFormData(result));
  } catch (err) {
    next(err);
  }
};

export function formOperation(
  apiId: AdspId,
  eventService: EventService,
  notificationService: NotificationService,
  queueTaskService: QueueTaskService,
  submissionRepository: FormSubmissionRepository,
  pdfService: PdfService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;

      const form: FormEntity = req[FORM];
      const request: FormOperations = req.body;

      let result: FormEntity = null;
      let event: DomainEvent = null;

      switch (request.operation) {
        case SEND_CODE_OPERATION: {
          result = await form.sendCode(user, notificationService);
          break;
        }
        case UNLOCK_FORM_OPERATION: {
          result = await form.unlock(user);
          event = formUnlocked(apiId, user, result);
          break;
        }
        case SUBMIT_FORM_OPERATION: {
          const [submittedForm, submission] = await form.submit(
            user,
            queueTaskService,
            submissionRepository,
            pdfService
          );
          result = submittedForm;

          event = formSubmitted(apiId, user, result, submission);
          break;
        }
        case SET_TO_DRAFT_FORM_OPERATION: {
          result = await form.setToDraft(user);
          event = formSetToDraft(apiId, user, result);
          break;
        }
        case ARCHIVE_FORM_OPERATION: {
          result = await form.archive(user);
          event = formArchived(apiId, user, result);
          break;
        }
        default:
          throw new InvalidOperationError(`Form operation '${req.body.operation}' not recognized.`);
      }

      end();

      res.send(mapForm(apiId, result));
      if (event) {
        eventService.send(event);
      }
    } catch (err) {
      next(err);
    }
  };
}

export function deleteForm(
  apiId: AdspId,
  eventService: EventService,
  fileService: FileService,
  notificationService: NotificationService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const form: FormEntity = req[FORM];

      const deleted = await form.delete(user, fileService, notificationService);

      end();
      res.send({ deleted });
      eventService.send(formDeleted(apiId, user, form));
    } catch (err) {
      next(err);
    }
  };
}

export const validateCriteria = (value: string) => {
  const criteria = JSON.parse(value);
  if (criteria?.createDateBefore !== undefined) {
    if (!validator.isISO8601(criteria?.createDateBefore)) {
      throw new InvalidOperationError('createDateBefore requires ISO-8061 date string.');
    }
  }
  if (criteria?.createDateAfter !== undefined) {
    if (!validator.isISO8601(criteria?.createDateAfter)) {
      throw new InvalidOperationError('createDateAfter requires ISO-8061 date string.');
    }
  }
  if (criteria?.dispositionDateBefore !== undefined) {
    if (!validator.isISO8601(criteria?.dispositionDateBefore)) {
      throw new InvalidOperationError('dispositionDateBefore requires ISO-8061 date string.');
    }
  }
  if (criteria?.dispositionDateAfter !== undefined) {
    if (!validator.isISO8601(criteria?.dispositionDateAfter)) {
      throw new InvalidOperationError('dispositionDateAfter requires ISO-8061 date string.');
    }
  }
};

interface FormRouterProps {
  apiId: AdspId;
  repository: FormRepository;
  eventService: EventService;
  tenantService: TenantService;
  notificationService: NotificationService;
  queueTaskService: QueueTaskService;
  fileService: FileService;
  commentService: CommentService;
  submissionRepository: FormSubmissionRepository;
  pdfService: PdfService;
}

export function createFormRouter({
  apiId,
  repository,
  eventService,
  tenantService,
  notificationService,
  queueTaskService,
  fileService,
  commentService,
  submissionRepository,
  pdfService,
}: FormRouterProps): Router {
  const router = Router();

  router.get('/definitions', getFormDefinitions);
  router.get(
    '/definitions/:definitionId',
    createValidationHandler(param('definitionId').isString().isLength({ min: 1, max: 50 })),
    getFormDefinition(tenantService)
  );

  router.get(
    '/forms',
    assertAuthenticatedHandler,
    createValidationHandler(
      ...checkSchema(
        {
          top: { optional: true, isInt: { options: { min: 1, max: 5000 } } },
          after: { optional: true, isString: true },
        },
        ['query']
      )
    ),
    findForms(apiId, repository)
  );
  router.post(
    '/forms',
    assertAuthenticatedHandler,
    createValidationHandler(
      body('definitionId').isString().isLength({ min: 1, max: 50 }),
      body('applicant.id').optional().isString(),
      body('applicant.userId').optional().isString(),
      body('applicant.channels').optional().isArray(),
      body('data').optional().isObject(),
      body('files').optional().isObject(),
      body('submit').optional().isBoolean()
    ),
    createForm(
      apiId,
      repository,
      submissionRepository,
      eventService,
      commentService,
      notificationService,
      queueTaskService,
      pdfService
    )
  );

  router.get(
    '/forms/:formId',
    assertAuthenticatedHandler,
    createValidationHandler(param('formId').isUUID()),
    getForm(repository),
    (req, res) => res.send(mapForm(apiId, req[FORM]))
  );
  router.post(
    '/forms/:formId',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('formId').isUUID(),
      body('operation').isIn([
        SEND_CODE_OPERATION,
        UNLOCK_FORM_OPERATION,
        SUBMIT_FORM_OPERATION,
        ARCHIVE_FORM_OPERATION,
        SET_TO_DRAFT_FORM_OPERATION,
      ])
    ),
    getForm(repository),
    formOperation(apiId, eventService, notificationService, queueTaskService, submissionRepository, pdfService)
  );
  router.delete(
    '/forms/:formId',
    assertAuthenticatedHandler,
    createValidationHandler(param('formId').isUUID()),
    getForm(repository),
    deleteForm(apiId, eventService, fileService, notificationService)
  );

  router.get(
    '/forms/:formId/data',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('formId').isUUID(),
      query('code').optional().isString().isLength({ min: 1, max: 10 })
    ),
    getForm(repository),
    accessForm(notificationService)
  );
  router.put(
    '/forms/:formId/data',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('formId').isUUID(),
      body('data').optional({ nullable: true }).isObject(),
      body('files').optional({ nullable: true }).isObject()
    ),
    getForm(repository),
    updateFormData
  );

  router.get(
    '/forms/:formId/submissions',
    assertAuthenticatedHandler,
    createValidationHandler(
      query('criteria')
        .optional()
        .custom(async (value: string) => {
          validateCriteria(value);
        })
    ),
    findFormSubmissions(apiId, submissionRepository, repository)
  );

  router.get(
    '/forms/:formId/submissions/:submissionId',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('formId').isUUID(),
      param('submissionId').isUUID(),
      getFormSubmission(apiId, submissionRepository)
    )
  );
  router.post(
    '/forms/:formId/submissions/:submissionId',
    assertAuthenticatedHandler,
    createValidationHandler(
      body('dispositionStatus').isString().isLength({ min: 1 }),
      body('dispositionReason').isString().isLength({ min: 1 })
    ),
    updateFormSubmissionDisposition(apiId, eventService, repository, submissionRepository)
  );

  return router;
}
