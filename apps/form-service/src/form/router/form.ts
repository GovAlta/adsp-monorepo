import {
  adspId,
  AdspId,
  DomainEvent,
  EventService,
  isAllowedUser,
  UnauthorizedUserError,
} from '@abgov/adsp-service-sdk';
import { createValidationHandler, InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { formSubmitted, formUnlocked } from '..';
import { formCreated } from '../events';
import { FormDefinitionEntity, FormEntity } from '../model';
import { NotificationService } from '../../notification';
import { FormRepository } from '../repository';
import { FormServiceRoles } from '../roles';
import { Form, FormCriteria, FormDefinition } from '../types';
import {
  ARCHIVE_FORM_OPERATION,
  FormOperations,
  SEND_CODE_OPERATION,
  SUBMIT_FORM_OPERATION,
  UNLOCK_FORM_OPERATION,
} from './types';
import { FileService } from '../../file';
import { body, checkSchema, param, query } from 'express-validator';

export function mapFormDefinition(entity: FormDefinitionEntity): FormDefinition {
  return {
    id: entity.id,
    name: entity.name,
    description: entity.description,
    anonymousApply: entity.anonymousApply,
    applicantRoles: entity.applicantRoles,
    assessorRoles: entity.assessorRoles,
    formDraftUrlTemplate: entity.formDraftUrlTemplate,
  };
}

export function mapForm(
  apiId: AdspId,
  entity: FormEntity
): Omit<Form, 'definition' | 'applicant' | 'data' | 'files'> & { urn: string; applicant: { addressAs: string } } {
  return {
    urn: adspId`${apiId}:/forms/${entity.id}`.toString(),
    id: entity.id,
    formDraftUrl: entity.formDraftUrl,
    status: entity.status,
    created: entity.created,
    createdBy: entity.createdBy,
    locked: entity.locked,
    submitted: entity.submitted,
    lastAccessed: entity.lastAccessed,
    applicant: entity.applicant
      ? {
          addressAs: entity.applicant.addressAs,
        }
      : null,
  };
}

export function mapFormData(entity: FormEntity): Pick<Form, 'id' | 'data' | 'files'> {
  return {
    id: entity.id,
    data: entity.data,
    files: Object.entries(entity.files || {}).reduce((f, [k, v]) => ({ ...f, [k]: v?.toString() }), {}),
  };
}

export const getFormDefinitions: RequestHandler = async (req, res, next) => {
  try {
    const [configuration] = await req.getConfiguration<Record<string, FormDefinitionEntity>>();
    const definitions = Object.entries(configuration).map(([_id, entity]) => mapFormDefinition(entity));
    res.send(definitions);
  } catch (err) {
    next(err);
  }
};

export const getFormDefinition: RequestHandler = async (req, res, next) => {
  try {
    const { definitionId } = req.params;

    const [configuration] = await req.getConfiguration<Record<string, FormDefinitionEntity>>();
    const definition = configuration[definitionId];
    if (!definition) {
      throw new NotFoundError('form definition', definitionId);
    }

    res.send(mapFormDefinition(definition));
  } catch (err) {
    next(err);
  }
};

export function findForms(apiId: AdspId, repository: FormRepository): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { top: topValue, after, criteria: criteriaValue } = req.query;
      const top = topValue ? parseInt(topValue as string) : 10;
      const criteria: FormCriteria = criteriaValue ? JSON.parse(criteriaValue as string) : {};

      if (!isAllowedUser(user, user.tenantId, FormServiceRoles.Admin)) {
        throw new UnauthorizedUserError('find forms', user);
      }

      if (user.tenantId) {
        criteria.tenantIdEquals = user.tenantId;
      }

      const { results, page } = await repository.find(top, after as string, criteria);
      res.send({
        results: results.map((r) => mapForm(apiId, r)),
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
  notificationService: NotificationService
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { definitionId, applicant: applicantInfo } = req.body;

      const [configuration] = await req.getConfiguration<Record<string, FormDefinitionEntity>>();
      const definition = configuration[definitionId];
      if (!definition) {
        throw new NotFoundError('form definition', definitionId);
      }

      const form = await definition.createForm(user, repository, notificationService, applicantInfo);
      res.send(mapForm(apiId, form));

      eventService.send(formCreated(user, form));
    } catch (err) {
      next(err);
    }
  };
}

const FORM = 'form';
export function getForm(repository: FormRepository): RequestHandler {
  return async (req, _res, next) => {
    try {
      const { formId } = req.params;
      const form = await repository.get(req.tenant.id, formId);
      if (!form) {
        throw new NotFoundError('form', formId);
      }
      req[FORM] = form;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export function accessForm(notificationService: NotificationService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { code } = req.query;
      const form: FormEntity = req[FORM];

      const result = await (code
        ? form.accessByCode(user, notificationService, code as string)
        : form.accessByUser(user));

      res.send(mapFormData(result));
    } catch (err) {
      next(err);
    }
  };
}

export const updateFormData: RequestHandler = async (req, res, next) => {
  try {
    const user = req.user;
    const form: FormEntity = req[FORM];
    const { data, files: fileIds } = req.body;
    const files: Record<string, AdspId> = Object.entries(fileIds || {}).reduce(
      (ids, [k, v]) => ({ ...ids, [k]: AdspId.parse(v as string) }),
      {}
    );

    const result = await form.update(user, data, files);
    res.send(mapFormData(result));
  } catch (err) {
    next(err);
  }
};

export function formOperation(
  apiId: AdspId,
  eventService: EventService,
  notificationService: NotificationService
): RequestHandler {
  return async (req, res, next) => {
    try {
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
          event = formUnlocked(user, result);
          break;
        }
        case SUBMIT_FORM_OPERATION: {
          result = await form.submit(user);
          event = formSubmitted(user, result);
          break;
        }
        case ARCHIVE_FORM_OPERATION: {
          result = await form.archive(user);
          break;
        }
        default:
          throw new InvalidOperationError(`Form operation '${req.body.operation}' not recognized.`);
      }
      res.send(mapForm(apiId, result));

      if (event) {
        eventService.send(event);
      }
    } catch (err) {
      next(err);
    }
  };
}

export function deleteForm(fileService: FileService, notificationService: NotificationService): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const form: FormEntity = req[FORM];

      const deleted = await form.delete(user, fileService, notificationService);
      res.send({ deleted });
    } catch (err) {
      next(err);
    }
  };
}

interface FormRouterProps {
  serviceId: AdspId;
  repository: FormRepository;
  eventService: EventService;
  notificationService: NotificationService;
  fileService: FileService;
}

export function createFormRouter({
  serviceId,
  repository,
  eventService,
  notificationService,
  fileService,
}: FormRouterProps): Router {
  const apiId = adspId`${serviceId}:v1`;

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
  router.post(
    '/forms',
    createValidationHandler(
      body('definitionId').isString().isLength({ min: 1, max: 50 }),
      body('applicant.id').optional().isString(),
      body('applicant.userId').optional().isString(),
      body('applicant.channels').optional().isArray()
    ),
    createForm(apiId, repository, eventService, notificationService)
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
      ])
    ),
    getForm(repository),
    formOperation(apiId, eventService, notificationService)
  );
  router.delete(
    '/forms/:formId',
    createValidationHandler(param('formId').isUUID()),
    getForm(repository),
    deleteForm(fileService, notificationService)
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
    createValidationHandler(param('formId').isUUID(), body('data').isObject(), body('files').optional().isObject()),
    getForm(repository),
    updateFormData
  );

  return router;
}
