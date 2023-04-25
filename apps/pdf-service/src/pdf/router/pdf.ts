import { AdspId, EventService, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import {
  createValidationHandler,
  InvalidOperationError,
  NotFoundError,
  WorkQueueService,
} from '@core-services/core-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, param } from 'express-validator';
import { Logger } from 'winston';
import { pdfGenerationQueued } from '../events';
import { GENERATED_PDF } from '../fileTypes';
import { PdfServiceWorkItem } from '../job';
import { PdfTemplateEntity } from '../model';
import { PdfJobRepository } from '../repository';
import { ServiceRoles } from '../roles';
import { FileService, PdfJob } from '../types';

export interface RouterProps {
  serviceId: AdspId;
  logger: Logger;
  repository: PdfJobRepository;
  queueService: WorkQueueService<PdfServiceWorkItem>;
  eventService: EventService;
  fileService: FileService;
}

function mapPdfTemplate({ id, name, description, template }: PdfTemplateEntity) {
  return {
    id,
    name,
    description,
    template,
  };
}

function mapJob(serviceId: AdspId, { id, status, result }: PdfJob) {
  return {
    urn: `${serviceId}:v1:/jobs/${id}`,
    id,
    status,
    result: result ? { urn: result.urn, id: result.id, filename: result.filename } : null,
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

export function generatePdf(
  serviceId: AdspId,
  repository: PdfJobRepository,
  eventService: EventService,
  fileService: FileService,
  queueService: WorkQueueService<PdfServiceWorkItem>
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;
      const { templateId, fileType, filename, recordId, data } = req.body;
      const template: PdfTemplateEntity = req[TEMPLATE];

      if (!isAllowedUser(user, template.tenantId, ServiceRoles.PdfGenerator)) {
        throw new UnauthorizedUserError('generate pdf', user);
      }

      if (fileType) {
        const typeExists = await fileService.typeExists(tenantId, fileType);
        if (!typeExists) {
          throw new InvalidOperationError(`Specified target file type '${fileType}' cannot be found.`);
        }
      }

      const job = await repository.create(tenantId);
      await queueService.enqueue({
        timestamp: new Date(),
        work: 'generate',
        jobId: job.id,
        tenantId: `${tenantId}`,
        fileType: fileType || GENERATED_PDF,
        templateId,
        filename,
        recordId: recordId || job.id,
        data: data || {},
        requestedBy: {
          id: user.id,
          name: user.name,
        },
      });

      eventService.send(pdfGenerationQueued(tenantId, job.id, templateId, { id: user.id, name: user.name }));

      res.send(mapJob(serviceId, job));
    } catch (err) {
      next(err);
    }
  };
}

export function getGeneratedFile(serviceId: AdspId, repository: PdfJobRepository): RequestHandler {
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
}: RouterProps): Router {
  const router = Router();

  router.get('/templates', getTemplates);
  router.get(
    '/templates/:templateId',
    createValidationHandler(param('templateId').isString().isLength({ min: 1, max: 50 })),
    getTemplate('params'),
    (req: Request, res: Response) => res.send(mapPdfTemplate(req[TEMPLATE]))
  );
  router.post(
    '/jobs',
    createValidationHandler(
      body('operation').isIn(['generate']),
      body('templateId').isString().isLength({ min: 1, max: 50 }),
      body('data').optional().isObject(),
      body('filename').isString().isLength({ min: 1, max: 50 }),
      body('fileType').optional().isString().isLength({ min: 1, max: 50 }),
      body('recordId').optional().isString()
    ),
    getTemplate('body'),
    generatePdf(serviceId, repository, eventService, fileService, queueService)
  );
  router.get('/jobs/:jobId', createValidationHandler(param('jobId').isUUID()), getGeneratedFile(serviceId, repository));

  return router;
}
