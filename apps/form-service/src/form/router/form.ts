import {
  AdspId,
  adspId,
  DomainEvent,
  EventService,
  isAllowedUser,
  startBenchmark,
  UnauthorizedUserError,
  ServiceDirectory,
} from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Request, RequestHandler, Router } from 'express';
import { body, checkSchema, param, query } from 'express-validator';
import { NotificationService } from '../../notification';
import {
  formArchived,
  formCreated,
  formDeleted,
  formSetToDraft,
  formSubmitted,
  formUnlocked,
  submissionDispositioned,
} from '../events';
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
import { FileService } from '../../file';
import validator from 'validator';
import { QueueTaskService } from '../../task';
import { CommentService } from '../comment';
import { mapForm, mapFormDefinition } from '../mapper';
import axios from 'axios';

export function mapFormData(entity: FormEntity): Pick<Form, 'id' | 'data' | 'files'> {
  return {
    id: entity.id,
    data: entity.data,
    files: Object.entries(entity.files || {}).reduce((f, [k, v]) => ({ ...f, [k]: v?.toString() }), {}),
  };
}

async function GeneratePdf(form: FormEntity, directory: ServiceDirectory, recordId: string, token: string) {
  const config = {
    id: form.definition?.id,
    name: form.definition?.name,
    dataSchema: form.definition?.dataSchema,
    uiSchema: form.definition?.uiSchema,
  };

  const formDefinitions = {
    content: { config, data: form.data },
  };

  const pdfGenerateBody = {
    operation: 'generate',
    templateId: form.submissionPdfTemplate,
    data: formDefinitions,
    filename: `${form.submissionPdfTemplate}-${form.definition?.id}.pdf`,
    recordId: recordId,
  };

  const baseUrl = await directory.getServiceUrl(adspId`urn:ads:platform:pdf-service`);
  const configUrl = new URL(`/pdf/v1/jobs`, baseUrl);
  await axios.post(configUrl.href, pdfGenerateBody, {
    headers: { Authorization: `Bearer ${token}` },
  });
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
    const user = req.user;

    const [configuration] = await req.getConfiguration<Record<string, FormDefinitionEntity>>();
    const definitions = Object.entries(configuration)
      .filter(([_id, entity]) => entity.canAccessDefinition(user))
      .map(([_id, entity]) => mapFormDefinition(entity));
    res.send(definitions);
  } catch (err) {
    next(err);
  }
};

async function getDefinitionFromConfiguration(req: Request, definitionId: string): Promise<FormDefinitionEntity> {
  let [definition] = await req.getServiceConfiguration<FormDefinitionEntity>(definitionId);

  // TODO: Remove after configuration is transitioned to form-service namespace.
  if (!definition) {
    const [configuration] = await req.getConfiguration<Record<string, FormDefinitionEntity>>();

    definition =
      configuration[Object.keys(configuration).find((key) => key.toLowerCase() === definitionId.toLowerCase())] ?? null;
  }

  if (!definition) {
    throw new NotFoundError('form definition', definitionId);
  }

  return definition;
}

export const getFormDefinition: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const { definitionId } = req.params;

    const definition = await getDefinitionFromConfiguration(req, definitionId);

    if (!definition.canAccessDefinition(user)) {
      throw new UnauthorizedUserError('access definition', user);
    }

    res.send(mapFormDefinition(definition));
  } catch (err) {
    next(err);
  }
};

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
  eventService: EventService,
  notificationService: NotificationService,
  commentService: CommentService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const { definitionId, applicant: applicantInfo } = req.body;

      const definition = await getDefinitionFromConfiguration(req, definitionId);
      const form = await definition.createForm(user, repository, notificationService, applicantInfo);

      end();
      const result = mapForm(apiId, form);
      res.send(result);

      eventService.send(formCreated(apiId, user, form));
      if (definition.supportTopic) {
        commentService.createSupportTopic(form, result.urn);
      }
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
  directory: ServiceDirectory
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;

      const form: FormEntity = req[FORM];
      const request: FormOperations = req.body;

      const token = user?.token?.bearer;

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
          const [submittedForm, submission] = await form.submit(user, queueTaskService, submissionRepository);
          result = submittedForm;
          const recordId = submission?.id || submittedForm.id;

          event = formSubmitted(apiId, user, result, submission);
          if (form.submissionPdfTemplate.length > 0) {
            GeneratePdf(form, directory, recordId, token);
          }

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
// eslint-disable-next-line
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
  notificationService: NotificationService;
  queueTaskService: QueueTaskService;
  fileService: FileService;
  commentService: CommentService;
  submissionRepository: FormSubmissionRepository;
  directory: ServiceDirectory;
}

export function createFormRouter({
  apiId,
  repository,
  eventService,
  notificationService,
  queueTaskService,
  fileService,
  commentService,
  submissionRepository,
  directory,
}: FormRouterProps): Router {
  const router = Router();

  router.get('/definitions', getFormDefinitions);
  router.get(
    '/definitions/:definitionId',
    createValidationHandler(param('definitionId').isString().isLength({ min: 1, max: 50 })),
    getFormDefinition
  );

  router.get(
    '/forms',
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

  router.get(
    '/forms/:formId/submissions/:submissionId',
    createValidationHandler(
      param('formId').isUUID(),
      param('submissionId').isUUID(),
      getFormSubmission(apiId, submissionRepository)
    )
  );
  router.post(
    '/forms/:formId/submissions/:submissionId',
    createValidationHandler(
      body('dispositionStatus').isString().isLength({ min: 1 }),
      body('dispositionReason').isString().isLength({ min: 1 })
    ),
    updateFormSubmissionDisposition(apiId, eventService, repository, submissionRepository)
  );

  router.get(
    '/forms/:formId/submissions',
    createValidationHandler(
      query('criteria')
        .optional()
        .custom(async (value: string) => {
          validateCriteria(value);
        })
    ),
    findFormSubmissions(apiId, submissionRepository, repository)
  );
  router.post(
    '/forms',
    createValidationHandler(
      body('definitionId').isString().isLength({ min: 1, max: 50 }),
      body('applicant.id').optional().isString(),
      body('applicant.userId').optional().isString(),
      body('applicant.channels').optional().isArray()
    ),
    createForm(apiId, repository, eventService, notificationService, commentService)
  );

  router.get('/forms/:formId', createValidationHandler(param('formId').isUUID()), getForm(repository), (req, res) =>
    res.send(mapForm(apiId, req[FORM]))
  );
  router.post(
    '/forms/:formId',
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
    formOperation(apiId, eventService, notificationService, queueTaskService, submissionRepository, directory)
  );
  router.delete(
    '/forms/:formId',
    createValidationHandler(param('formId').isUUID()),
    getForm(repository),
    deleteForm(apiId, eventService, fileService, notificationService)
  );

  router.get(
    '/forms/:formId/data',
    createValidationHandler(
      param('formId').isUUID(),
      query('code').optional().isString().isLength({ min: 1, max: 10 })
    ),
    getForm(repository),
    accessForm(notificationService)
  );

  router.put(
    '/forms/:formId/data',
    createValidationHandler(
      param('formId').isUUID(),
      body('data').optional({ nullable: true }).isObject(),
      body('files').optional({ nullable: true }).isObject()
    ),
    getForm(repository),
    updateFormData
  );

  return router;
}
