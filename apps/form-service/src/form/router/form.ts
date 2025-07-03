import {
  AdspId,
  DomainEvent,
  EventService,
  isAllowedUser,
  startBenchmark,
  UnauthorizedUserError,
  TenantService,
  TokenProvider,
  ServiceDirectory,
  adspId,
} from '@abgov/adsp-service-sdk';
import {
  assertAuthenticatedHandler,
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  Results,
} from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import { body, checkSchema, param, query } from 'express-validator';
import validator from 'validator';
import { Logger } from 'winston';
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
  submissionDeleted,
  submissionDispositioned,
} from '../events';
import { mapForm, mapFormDefinition, mapFormSubmission, mapFormWithFormSubmission } from '../mapper';
import { FormDefinitionEntity, FormEntity, FormSubmissionEntity } from '../model';
import { FormRepository, FormSubmissionRepository } from '../repository';
import { ExportServiceRoles, FormServiceRoles } from '../roles';
import { Form, FormCriteria, FormDefinition, FormStatus, FormSubmissionCriteria, Intake } from '../types';
import {
  ARCHIVE_FORM_OPERATION,
  FormOperations,
  SEND_CODE_OPERATION,
  SUBMIT_FORM_OPERATION,
  UNLOCK_FORM_OPERATION,
  SET_TO_DRAFT_FORM_OPERATION,
} from './types';
import { PdfService } from '../pdf';
import { CalendarService } from '../calendar';

const configurationApiId = adspId`urn:ads:platform:configuration-service:v2`;

export function mapFormData(entity: FormEntity): Pick<Form, 'id' | 'data' | 'files'> {
  return {
    id: entity.id,
    data: entity.data,
    files: Object.entries(entity.files || {}).reduce((f, [k, v]) => ({ ...f, [k]: v?.toString() }), {}),
  };
}

export function mapFormForSubmission(apiId: AdspId, submissionRepository: FormSubmissionRepository): RequestHandler {
  return async (req, res, next) => {
    const form: FormEntity = req[FORM];
    try {
      const user = req.user;
      const { includeData: includeDataValue } = req.query;
      const includeData = includeDataValue === 'true';

      if (includeData) {
        await form.accessByUser(user);
      }

      if (form.status === FormStatus.Submitted && form.submitted !== null) {
        const criteria = {
          tenantIdEquals: req.tenant?.id,
          formIdEquals: form.id,
        };
        const { results } = await submissionRepository.find(100, null, {
          ...criteria,
        });

        if (results.length > 0) {
          res.send(mapFormWithFormSubmission(apiId, form, results.at(0), includeData));
        } else {
          res.send(mapForm(apiId, form, includeData));
        }
      } else {
        res.send(mapForm(apiId, form, includeData));
      }
    } catch (err) {
      next(err);
    }
  };
}

export function getFormDefinitions(directory: ServiceDirectory, tokenProvider: TokenProvider): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string) : 20;

      if (!isAllowedUser(user, tenantId, FormServiceRoles.Admin)) {
        throw new UnauthorizedUserError('access definitions', user);
      }

      const configurationApiUrl = await directory.getServiceUrl(configurationApiId);
      const token = await tokenProvider.getAccessToken();
      const { data } = await axios.get<
        Results<{
          latest: { revision: number; configuration: FormDefinition };
          active: { revision: number; configuration: FormDefinition };
        }>
      >(new URL('v2/configuration/form-service', configurationApiUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          top,
          after,
          tenantId: tenantId?.toString(),
          includeActive: true,
        },
      });

      res.send({
        ...data,
        results: data.results.map(({ latest, active }) =>
          active
            ? mapFormDefinition(active.configuration, active.revision)
            : mapFormDefinition(latest.configuration, latest.revision)
        ),
      });
    } catch (err) {
      next(err);
    }
  };
}

export function getFormDefinition(tenantService: TenantService, calendarService: CalendarService): RequestHandler {
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

      const [definition] = await req.getServiceConfiguration<FormDefinitionEntity>(definitionId, req.tenant.id);
      if (!definition) {
        throw new NotFoundError('form definition', definitionId);
      }

      if (!definition.canAccessDefinition(user)) {
        throw new UnauthorizedUserError('access definition', user);
      }

      let intake: Intake;
      if (definition.scheduledIntakes) {
        intake = await calendarService.getScheduledIntake(definition);
      }

      res.send(mapFormDefinition(definition, definition.revision, intake));
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
      const { top: topValue, after, criteria: criteriaValue, includeData: includeDataValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const includeData = includeDataValue === 'true';
      let criteria: FormCriteria = {};

      try {
        criteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};
      } catch (error) {
        throw new InvalidOperationError('Bad form criteria');
      }

      const hasAccessToAll = isAllowedUser(
        user,
        req.tenant.id,
        [FormServiceRoles.Admin, ExportServiceRoles.ExportJob],
        true
      );
      if (!hasAccessToAll) {
        // If user is not a form service admin, then limit search to only forms created by the user.
        criteria.createdByIdEquals = user.id;
        if (includeData) {
          throw new UnauthorizedUserError('find forms include data', user);
        }
      }

      if (user.tenantId) {
        criteria.tenantIdEquals = user.tenantId;
      }

      const { results, page } = await repository.find(top, after as string, criteria);

      end();
      res.send({
        results: results.filter((r) => hasAccessToAll || r.canRead(user)).map((r) => mapForm(apiId, r, includeData)),
        page,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function findSubmissions(apiId: AdspId, repository: FormSubmissionRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const tenantId = req.tenant.id;

      const { criteria: criteriaValue, top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string) : 100;
      const criteria: FormSubmissionCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      let definition: FormDefinitionEntity;
      if (criteria.definitionIdEquals) {
        [definition] = await req.getServiceConfiguration(criteria.definitionIdEquals, tenantId);
      }

      if (
        !isAllowedUser(user, tenantId, [FormServiceRoles.Admin, ...(definition?.assessorRoles || [])]) &&
        !isAllowedUser(user, tenantId, ExportServiceRoles.ExportJob, true)
      ) {
        throw new UnauthorizedUserError('find submissions', user);
      }

      const { results, page } = await repository.find(top, after as string, {
        ...criteria,
        tenantIdEquals: tenantId,
      });

      res.send({
        results: results.map((r) => mapFormSubmission(apiId, r)),
        page,
      });

      end();
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

      const { criteria: criteriaValue, top: topValue, after } = req.query;
      const top = topValue ? parseInt(topValue as string) : 100;
      const criteria: FormSubmissionCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      const formEntity: FormEntity = await formRepository.get(tenantId, formId);
      const definition = formEntity?.definition;

      if (
        !isAllowedUser(user, tenantId, [FormServiceRoles.Admin, ...(definition?.assessorRoles || [])]) &&
        !isAllowedUser(user, tenantId, ExportServiceRoles.ExportJob, true)
      ) {
        throw new UnauthorizedUserError('find form submissions', user);
      }

      const { results, page } = await repository.find(top, after as string, {
        ...criteria,
        tenantIdEquals: tenantId,
        formIdEquals: formId,
      });

      res.send({
        results: results.map((r) => mapFormSubmission(apiId, r)),
        page,
      });

      end();
    } catch (err) {
      next(err);
    }
  };
}

export function createForm(
  apiId: AdspId,
  logger: Logger,
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
      const tenantId = req.tenant?.id;
      const { definitionId, applicant: applicantInfo, data, files: fileIds, submit, dryRun } = req.body;

      logger.debug(`Creating form of definition '${definitionId}'...`, {
        context: 'FormRouter',
        tenantId: tenantId?.toString,
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });

      const [definition] = await req.getServiceConfiguration<FormDefinitionEntity>(definitionId);
      if (!definition) {
        throw new NotFoundError('form definition', definitionId);
      }

      let form = await definition.createForm(user, repository, notificationService, dryRun, applicantInfo);
      let formSubmission: FormSubmissionEntity = null;
      let event = formCreated(apiId, user, form, dryRun);

      // If data or files is set, then update the form.
      if (data || fileIds) {
        const files: Record<string, AdspId> = fileIds
          ? Object.entries(fileIds).reduce((ids, [k, v]) => ({ ...ids, [k]: AdspId.parse(v as string) }), {})
          : null;

        form = await form.update(user, data, files, dryRun);
      }

      let jobId = null;
      // If submit is true, then immediately submit the form.
      if (submit === true) {
        const [submittedForm, submission, pdfJobId] = await form.submit(
          user,
          queueTaskService,
          submissionRepository,
          pdfService,
          dryRun
        );
        jobId = pdfJobId;
        form = submittedForm;
        formSubmission = submission;
        // The create event is replaced with the submitted even.
        // This means that create events won't capture every new form creation.
        event = formSubmitted(apiId, user, form, submission, dryRun);
      }

      const formWithJobId: FormEntityWithJobId = form;
      formWithJobId.jobId = jobId;

      const result = formSubmission?.id
        ? mapFormWithFormSubmission(apiId, formWithJobId, formSubmission, dryRun)
        : mapForm(apiId, formWithJobId, false);

      res.send(result);

      eventService.send(event);

      if (definition.supportTopic) {
        commentService.createSupportTopic(form, result.urn);
      }

      logger.info(`Created form (ID: ${form.id}) of definition '${definitionId}'${submit ? ' and submitted' : ''}.`, {
        context: 'FormRouter',
        tenant: tenantId?.toString,
        user: `${user.name} (ID: ${user.id})`,
      });

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

      const formSubmission = await submissionRepository.get(req.tenant.id, submissionId, formId);
      if (!formSubmission) {
        throw new NotFoundError('Form Submission', submissionId);
      }

      if (!formSubmission.canRead(user)) {
        throw new UnauthorizedUserError('get form submission', user);
      }

      end();
      res.send(mapFormSubmission(apiId, formSubmission));
    } catch (err) {
      next(err);
    }
  };
}

export function deleteFormSubmission(
  apiId: AdspId,
  eventService: EventService,
  submissionRepository: FormSubmissionRepository
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'get-entity-time');
      const { formId, submissionId } = req.params;
      const user = req.user;
      const tenant = req.tenant;

      if (!isAllowedUser(user, tenant.id, FormServiceRoles.Admin, true)) {
        throw new UnauthorizedUserError('delete form submission', user);
      }

      let deleted = false;
      const formSubmission = await submissionRepository.get(tenant.id, submissionId, formId);
      if (formSubmission) {
        deleted = await submissionRepository.delete(formSubmission);
      }

      if (deleted) {
        eventService.send(submissionDeleted(apiId, user, formSubmission));
      }

      end();
      res.send({ deleted });
    } catch (err) {
      next(err);
    }
  };
}

export function updateFormSubmissionDisposition(
  apiId: AdspId,
  logger: Logger,
  eventService: EventService,
  submissionRepository: FormSubmissionRepository
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');
      const user = req.user;
      const tenantId = req.tenant?.id;
      const { formId, submissionId } = req.params;
      const { dispositionStatus, dispositionReason } = req.body;

      logger.debug(
        `Updating disposition of form submission with ID: ${submissionId} (form ID: ${formId}) to '${dispositionStatus}'...`,
        {
          context: 'FormRouter',
          tenantId: tenantId?.toString,
          user: user ? `${user.name} (ID: ${user.id})` : null,
        }
      );

      const formSubmission = await submissionRepository.get(tenantId, submissionId, formId);
      if (!formSubmission) {
        throw new NotFoundError('Form submission', submissionId);
      }

      const updated = await formSubmission.dispositionSubmission(user, dispositionStatus, dispositionReason);
      end();

      res.send(mapFormSubmission(apiId, updated));
      eventService.send(submissionDispositioned(apiId, user, updated));

      logger.info(
        `Updated disposition of form submission with ID: ${submissionId} (form ID: ${formId}) to '${dispositionStatus}'.`,
        {
          context: 'FormRouter',
          tenantId: tenantId?.toString,
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export function accessForm(logger: Logger, notificationService: NotificationService): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const { code } = req.query;
      const form: FormEntity = req[FORM];

      logger.debug(`Accessing form with ID: ${form.id} (definition ID: ${form.definition?.id}) data...`, {
        context: 'FormRouter',
        tenantId: form.tenantId.toString,
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });

      const result = await (code
        ? form.accessByCode(user, notificationService, code as string)
        : form.accessByUser(user));

      end();
      res.send(mapFormData(result));

      logger.info(`Accessed form with ID: ${form.id} (definition ID: ${form.definition.id}) data.`, {
        context: 'FormRouter',
        tenantId: form.tenantId.toString,
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function updateFormData(logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const form: FormEntity = req[FORM];
      const { data, files: fileIds } = req.body;

      logger.debug(`Updating form with ID: ${form.id} (definition ID: ${form.definition?.id}) data...`, {
        context: 'FormRouter',
        tenantId: form.tenantId.toString,
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });

      const files: Record<string, AdspId> = fileIds
        ? Object.entries(fileIds).reduce((ids, [k, v]) => ({ ...ids, [k]: AdspId.parse(v as string) }), {})
        : null;

      const result = await form.update(user, data, files);

      end();
      res.send(mapFormData(result));

      logger.info(`Updated form with ID: ${form.id} (definition ID: ${form.definition.id}) data.`, {
        context: 'FormRouter',
        tenantId: form.tenantId.toString,
        user: `${user.name} (ID: ${user.id})`,
      });
    } catch (err) {
      next(err);
    }
  };
}

export interface FormEntityWithJobId extends FormEntity {
  jobId?: string;
}

export function formOperation(
  apiId: AdspId,
  logger: Logger,
  eventService: EventService,
  notificationService: NotificationService,
  queueTaskService: QueueTaskService,
  submissionRepository: FormSubmissionRepository,
  pdfService: PdfService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const { dryRun } = req.body;

      const user = req.user;

      const form: FormEntity = req[FORM];
      const request: FormOperations = req.body;

      logger.debug(
        `Performing operation ${request.operation} on form with ID: ${form.id} (definition ID: ${form.definition?.id})...`,
        {
          context: 'FormRouter',
          tenantId: form.tenantId.toString,
          user: user ? `${user.name} (ID: ${user.id})` : null,
        }
      );

      let result: FormEntityWithJobId = null;
      let formSubmissionResult: FormSubmissionEntity = null;
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
          const [submittedForm, submission, jobId] = await form.submit(
            user,
            queueTaskService,
            submissionRepository,
            pdfService,
            dryRun || false
          );
          result = submittedForm;
          result.jobId = jobId;
          if (submission) {
            submission.dryRun = dryRun || false;
          }
          formSubmissionResult = submission;
          event = formSubmitted(apiId, user, result, submission, dryRun);
          break;
        }
        case SET_TO_DRAFT_FORM_OPERATION: {
          result = await form.setToDraft(user);
          event = formSetToDraft(apiId, user, result);
          break;
        }
        case ARCHIVE_FORM_OPERATION: {
          result = await form.archive(user, notificationService);
          event = formArchived(apiId, user, result);
          break;
        }
        default:
          throw new InvalidOperationError(`Form operation '${req.body.operation}' not recognized.`);
      }

      end();

      const mappedResult = formSubmissionResult
        ? mapFormWithFormSubmission(apiId, result, formSubmissionResult)
        : mapForm(apiId, result);

      res.send(mappedResult);
      if (event) {
        eventService.send(event);
      }

      logger.info(
        `Performed operation ${request.operation} on form with ID: ${form.id} (definition ID: ${form.definition.id}).`,
        {
          context: 'FormRouter',
          tenantId: form.tenantId.toString,
          user: `${user.name} (ID: ${user.id})`,
        }
      );
    } catch (err) {
      next(err);
    }
  };
}

export function deleteForm(
  apiId: AdspId,
  logger: Logger,
  eventService: EventService,
  fileService: FileService,
  notificationService: NotificationService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const end = startBenchmark(req, 'operation-handler-time');

      const user = req.user;
      const form: FormEntity = req[FORM];

      logger.debug(`Deleting form with ID: ${form.id} (definition ID: ${form.definition?.id})...`, {
        context: 'FormRouter',
        tenantId: form.tenantId.toString,
        user: user ? `${user.name} (ID: ${user.id})` : null,
      });

      const deleted = await form.delete(user, fileService, notificationService);

      end();
      res.send({ deleted });
      eventService.send(formDeleted(apiId, user, form));

      logger.info(`Deleted form with ID: ${form.id} (definition ID: ${form.definition?.id}).`, {
        context: 'FormRouter',
        tenantId: form.tenantId.toString,
        user: `${user.name} (ID: ${user.id})`,
      });
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
  logger: Logger;
  repository: FormRepository;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
  tenantService: TenantService;
  notificationService: NotificationService;
  queueTaskService: QueueTaskService;
  fileService: FileService;
  commentService: CommentService;
  submissionRepository: FormSubmissionRepository;
  pdfService: PdfService;
  calendarService: CalendarService;
}

export function createFormRouter({
  apiId,
  logger,
  repository,
  directory,
  tokenProvider,
  eventService,
  tenantService,
  notificationService,
  queueTaskService,
  fileService,
  commentService,
  submissionRepository,
  pdfService,
  calendarService,
}: FormRouterProps): Router {
  const router = Router();

  router.get('/definitions', getFormDefinitions(directory, tokenProvider));
  router.get(
    '/definitions/:definitionId',
    createValidationHandler(param('definitionId').isString().isLength({ min: 1, max: 50 })),
    getFormDefinition(tenantService, calendarService)
  );

  router.get(
    '/forms',
    assertAuthenticatedHandler,
    createValidationHandler(
      ...checkSchema(
        {
          top: { optional: true, isInt: { options: { min: 1, max: 5000 } } },
          after: { optional: true, isString: true },
          criteria: { optional: true, isJSON: true },
          includeData: { optional: true, isBoolean: true },
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
      logger,
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
    createValidationHandler(param('formId').isUUID(), query('includeData').optional().isBoolean()),
    getForm(repository),
    mapFormForSubmission(apiId, submissionRepository)
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
    formOperation(apiId, logger, eventService, notificationService, queueTaskService, submissionRepository, pdfService)
  );
  router.delete(
    '/forms/:formId',
    assertAuthenticatedHandler,
    createValidationHandler(param('formId').isUUID()),
    getForm(repository),
    deleteForm(apiId, logger, eventService, fileService, notificationService)
  );

  router.get(
    '/forms/:formId/data',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('formId').isUUID(),
      query('code').optional().isString().isLength({ min: 1, max: 10 })
    ),
    getForm(repository),
    accessForm(logger, notificationService)
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
    updateFormData(logger)
  );

  router.get(
    '/submissions',
    assertAuthenticatedHandler,
    createValidationHandler(
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after').optional().isString(),
      query('criteria')
        .optional()
        .custom(async (value: string) => {
          validateCriteria(value);
        })
    ),
    findSubmissions(apiId, submissionRepository)
  );

  router.get(
    '/submissions/:submissionId',
    assertAuthenticatedHandler,
    createValidationHandler(param('submissionId').isUUID()),
    getFormSubmission(apiId, submissionRepository)
  );

  router.delete(
    '/submissions/:submissionId',
    assertAuthenticatedHandler,
    createValidationHandler(param('submissionId').isUUID()),
    deleteFormSubmission(apiId, eventService, submissionRepository)
  );

  router.get(
    '/forms/:formId/submissions',
    assertAuthenticatedHandler,
    createValidationHandler(
      param('formId').isUUID(),
      query('top').optional().isInt({ min: 1, max: 5000 }),
      query('after').optional().isString(),
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
    updateFormSubmissionDisposition(apiId, logger, eventService, submissionRepository)
  );

  return router;
}
