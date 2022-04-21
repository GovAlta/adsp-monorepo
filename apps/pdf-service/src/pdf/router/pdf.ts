import { AdspId, EventService, isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { createValidationHandler, NotFoundError, WorkQueueService } from '@core-services/core-common';
import { Request, RequestHandler, Response, Router } from 'express';
import { body, param } from 'express-validator';
import { Logger } from 'winston';
import { pdfGenerationQueued } from '../events';
import { PdfServiceWorkItem } from '../job';
import { PdfTemplateEntity } from '../model';
import { PdfJobRepository } from '../repository';
import { ServiceRoles } from '../roles';
import { PdfJob } from '../types';

export interface RouterProps {
  serviceId: AdspId;
  logger: Logger;
  repository: PdfJobRepository;
  queueService: WorkQueueService<PdfServiceWorkItem>;
  eventService: EventService;
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
    result,
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
export const getTemplate: RequestHandler = async (req, res, next) => {
  try {
    const { templateId } = req.params;
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

export function generatePdf(
  repository: PdfJobRepository,
  eventService: EventService,
  queueService: WorkQueueService<PdfServiceWorkItem>
): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const tenantId = req.tenant.id;
      const { templateId, filename, data } = req.body;
      const template: PdfTemplateEntity = req[TEMPLATE];

      if (!isAllowedUser(user, template.tenantId, ServiceRoles.PdfGenerator)) {
        throw new UnauthorizedUserError('generate pdf', user);
      }

      const { id: jobId } = await repository.create(tenantId);
      await queueService.enqueue({
        timestamp: new Date(),
        work: 'generate',
        jobId,
        tenantId: `${tenantId}`,
        templateId,
        filename,
        data,
        generatedBy: {
          id: user.id,
          name: user.name,
        },
      });

      eventService.send(pdfGenerationQueued(tenantId, jobId, templateId, { id: user.id, name: user.name }));

      res.send({ id: jobId });
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

export function createPdfRouter({ serviceId, repository, eventService, queueService }: RouterProps): Router {
  const router = Router();

  router.get('/templates', getTemplates);
  router.get(
    '/templates/:templateId',
    createValidationHandler(param('templateId').isString().isLength({ min: 1, max: 50 })),
    getTemplate,
    (req: Request, res: Response) => res.send(mapPdfTemplate(req[TEMPLATE]))
  );
  router.post(
    '/jobs',
    createValidationHandler(
      body('templateId').isString().isLength({ min: 1, max: 50 }),
      body('filename').isString().isLength({ min: 1, max: 50 }),
      body('data').optional().isObject()
    ),
    getTemplate,
    generatePdf(repository, eventService, queueService)
  );
  router.get(
    '/jobs/:jobId',
    createValidationHandler(param('jobId').isUUID()),
    getTemplate,
    getGeneratedFile(serviceId, repository)
  );

  return router;
}
