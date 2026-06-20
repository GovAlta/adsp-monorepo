import {
  AdspId,
  adspId,
  EventService,
  isAllowedUser,
  ServiceDirectory,
  UnauthorizedUserError,
  TokenProvider
} from '@abgov/adsp-service-sdk';
import * as HttpStatusCodes from 'http-status-codes';
import axios from 'axios';
import {
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  WorkQueueService,
} from '@core-services/core-common';
import { FileResult, FileService, JobRepository, mapJob } from '@core-services/job-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, param } from 'express-validator';
import { Logger } from 'winston';
import { pdfGenerationQueued } from '../events';
import { GENERATED_PDF } from '../fileTypes';
import { PdfServiceWorkItem } from '../job';
import { PdfTemplateEntity } from '../model';
import { ServiceRoles } from '../roles';
import { ConfigurationDeleteOperation, ConfigurationUpdateOperation, PdfTemplateConfiguration  } from '../types';

export interface RouterProps {
  serviceId: AdspId;
  logger: Logger;
  repository: JobRepository<FileResult>;
  queueService: WorkQueueService<PdfServiceWorkItem>;
  eventService: EventService;
  fileService: FileService;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
}

function mapPdfTemplate({ id, name, description, template }: PdfTemplateEntity) {
  return {
    id,
    name,
    description,
    template,
  };
}

export const getTemplates: RequestHandler = async (req, res, next) => {
  try {
    const [configuration] = await req.getConfiguration<Record<string, PdfTemplateEntity>>();
    res.send(Object.values(configuration).map(mapPdfTemplate));
  } catch (err) {
    next(err);
  }
};

const TEMPLATE = 'template';
export function getTemplate(templateIn: 'params' | 'body'): RequestHandler {
  return async (req, res, next) => {
    try {
      const { templateId } = req[templateIn];
      const [configuration] = await req.getConfiguration<Record<string, PdfTemplateEntity>>();

      const template = configuration[templateId];

      if (!template) {
        throw new NotFoundError('PDF Template', templateId);
      }

      req[TEMPLATE] = template;

      next();
    } catch (err) {
      next(err);
    }
  };
}


const toTemplateId = (name: string): string =>
  name.trim().toLowerCase().replace(/\s+/g, '-');

const createPdfTemplatePatch = (
  id: string,
  name: string,
  description = '',
): ConfigurationUpdateOperation<PdfTemplateConfiguration> => ({
  operation: 'UPDATE',
  update: {
    [id]: {
      id,
      name,
      description,
      template: '',
    },
  },
});

const isTemplateIdAlreadyInUse = (
  configuration: Record<string, PdfTemplateEntity>,
  name: string,
): boolean => Boolean(configuration[name]);

async function savePdfTemplate(
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
  tenantId: string,
  patch: ReturnType<typeof createPdfTemplatePatch>,
): Promise<void> {
  const configurationServiceId =
    adspId`urn:ads:platform:configuration-service:v2`;
  const configurationApiUrl =
    await directory.getServiceUrl(configurationServiceId);
  const token = await tokenProvider.getAccessToken();

  await axios.patch(
    new URL(
      'v2/configuration/platform/pdf-service',
      configurationApiUrl,
    ).href,
    patch,
    {
      headers: { Authorization: `Bearer ${token}` },
      params: { tenantId },
    },
  );
}

export function createPdfTemplate(
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { name, description = '' } = req.body;
      const id = toTemplateId(name);
      const [configuration] =
        await req.getConfiguration<Record<string, PdfTemplateEntity>>();

      if (isTemplateIdAlreadyInUse(configuration, id)) {
        return res.status(HttpStatusCodes.CONFLICT).send({
          error: `PDF template '${name}' already exists.`,
        });
      }

      const patch = createPdfTemplatePatch(id, name, description);

      await savePdfTemplate(
        directory,
        tokenProvider,
        req.tenant.id.toString(),
        patch,
      );

      res.status(HttpStatusCodes.CREATED).json(patch.update[id]);
    } catch (err) {
      next(err);
    }
  };
}

export function deletePdfTemplate(
  directory: ServiceDirectory,
  tokenProvider: TokenProvider,
): RequestHandler {
  return async (req, res, next) => {
    try {
      const { templateId } = req.params;
      const configurationServiceId = adspId`urn:ads:platform:configuration-service:v2`;
      const configurationApiUrl = await directory.getServiceUrl(configurationServiceId);
      const token = await tokenProvider.getAccessToken();

      const patch: ConfigurationDeleteOperation = { operation: 'DELETE', property: templateId };
      await axios.patch(
        new URL('v2/configuration/platform/pdf-service', configurationApiUrl).href,
        patch,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { tenantId: req.tenant.id.toString() },
        },
      );

      res.status(HttpStatusCodes.CREATED).send();
    } catch (err) {
      next(err);
    }
  };
}

export function generatePdf(
  serviceId: AdspId,
  repository: JobRepository<FileResult>,
  eventService: EventService,
  fileService: FileService,
  queueService: WorkQueueService<PdfServiceWorkItem>,
  logger: Logger
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const allowCore = true;
      const tenantId = req.tenant?.id || (req.query.tenantId && adspId`${req.query.tenantId}`);
      const { templateId, fileType, filename, recordId, data, context } = req.body;
      const template: PdfTemplateEntity = req[TEMPLATE];
      logger.info(`Start to process the template: ${templateId}`);

      if (!isAllowedUser(user, template.tenantId || tenantId, ServiceRoles.PdfGenerator, allowCore)) {
        throw new UnauthorizedUserError('generate pdf', user);
      }

      if (fileType) {
        const typeExists = await fileService.typeExists(tenantId, fileType);
        if (!typeExists) {
          throw new InvalidOperationError(`Specified target file type '${fileType}' cannot be found.`);
        }
      }

      const job = await repository.create(user, tenantId);
      logger.info(`Successfully created the job ${job.id}.`);

      await queueService.enqueue({
        timestamp: new Date(),
        work: 'generate',
        jobId: job.id,
        tenantId: `${tenantId}`,
        fileType: fileType || GENERATED_PDF,
        templateId,
        filename,
        recordId: recordId || job.id,
        context: context || {},
        data: data || {},
        requestedBy: {
          id: user.id,
          name: user.name,
        },
      });
      logger.info(`Successfully sent the job ${job.id} to work queue.`);

      eventService.send(pdfGenerationQueued(tenantId, job.id, templateId, context, { id: user.id, name: user.name }));
      logger.info(`Successfully sent the job ${job.id} generation message to the event queue.`);

      res.send(mapJob(serviceId, job));
    } catch (err) {
      next(err);
    }
  };
}

export function getGeneratedFile(serviceId: AdspId, repository: JobRepository<FileResult>): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;

      const { jobId } = req.params;

      const job = await repository.get(jobId);
      if (!job) {
        throw new NotFoundError('Generated PDF', jobId);
      }

      if (!isAllowedUser(user, job.tenantId, ServiceRoles.PdfGenerator)) {
        throw new UnauthorizedUserError('get generated pdf', user);
      }

      res.send(mapJob(serviceId, job));
    } catch (err) {
      next(err);
    }
  };
}

export function createPdfRouter({
  serviceId,
  repository,
  eventService,
  fileService,
  queueService,
  logger,
  directory,
  tokenProvider
}: RouterProps): Router {
  const router = Router();

  router.get('/templates', getTemplates);
  router.post(
    '/templates',
    createValidationHandler(
      body('name')
        .exists()
        .withMessage('name is required')
        .bail()
        .isString()
        .withMessage('name must be a string')
        .bail()
        .trim()
        .isLength({ min: 1, max: 50 })
        .withMessage('name must be between 1 and 50 characters')
        .matches(/^[a-zA-Z0-9 -]+$/)
        .withMessage(
          'name can contain only letters, numbers, spaces, and hyphens',
        ),
      body('description').optional().isString(),
    ),
    createPdfTemplate(directory, tokenProvider),
  );
  router.get(
    '/templates/:templateId',
    createValidationHandler(param('templateId').isString().isLength({ min: 1, max: 50 })),
    getTemplate('params'),
    (req: Request, res: Response) => res.send(mapPdfTemplate(req[TEMPLATE]))
  );
  router.delete(
    '/templates/:templateId',
    createValidationHandler(param('templateId').isString().isLength({ min: 1, max: 50 })),
    getTemplate('params'),
    deletePdfTemplate(directory, tokenProvider),
  );
  router.post(
    '/jobs',
    createValidationHandler(
      body('operation').isIn(['generate']),
      body('templateId').isString().isLength({ min: 1, max: 50 }),
      body('data').optional().isObject(),
      body('filename').isString().isLength({ min: 1, max: 60 }),
      body('fileType').optional().isString().isLength({ min: 1, max: 50 }),
      body('recordId').optional().isString(),
      body('context').optional().isObject()
    ),
    getTemplate('body'),
    generatePdf(serviceId, repository, eventService, fileService, queueService, logger)
  );
  router.get('/jobs/:jobId', createValidationHandler(param('jobId').isUUID()), getGeneratedFile(serviceId, repository));

  return router;
}
