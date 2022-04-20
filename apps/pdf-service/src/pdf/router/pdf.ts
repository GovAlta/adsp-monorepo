import { adspId, ServiceDirectory } from '@abgov/adsp-service-sdk';
import { createValidationHandler, NotFoundError, WorkQueueService } from '@core-services/core-common';
import axios from 'axios';
import { RequestHandler, Router } from 'express';
import { body, param } from 'express-validator';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import { PdfConfiguration } from '../configuration';
import { GENERATED_PDF } from '../fileTypes';
import { PdfServiceWorkItem } from '../job';
import { FileResult } from '../types';

export interface RouterProps {
  logger: Logger;
  queueService: WorkQueueService<PdfServiceWorkItem>;
}

export const getTemplates: RequestHandler = async (req, res, next) => {
  try {
    const [configuration] = await req.getConfiguration<PdfConfiguration>();
    res.send(Object.entries(configuration));
  } catch (err) {
    next(err);
  }
};

export const getTemplate: RequestHandler = async (req, res, next) => {
  try {
    const { templateId } = req.params;
    const [configuration] = await req.getConfiguration<PdfConfiguration>();
    const template = configuration[templateId];
    if (!template) {
      throw new NotFoundError('PDF Template', templateId);
    }

    res.send(template);
  } catch (err) {
    next(err);
  }
};

export function generatePdf(queueService: WorkQueueService<PdfServiceWorkItem>): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { templateId } = req.params;
      const { filename, data } = req.body;
      const jobId = uuid();

      const [configuration] = await req.getConfiguration<PdfConfiguration>();
      const template = configuration[templateId];
      if (!template) {
        throw new NotFoundError('PDF Template', templateId);
      }

      await queueService.enqueue({
        timestamp: new Date(),
        tenantId: `${req.tenant.id}`,
        work: 'generate',
        jobId,
        template,
        filename,
        data,
        generatedBy: {
          id: user.id,
          name: user.name,
        },
      });

      res.send({ id: jobId });
    } catch (err) {
      next(err);
    }
  };
}

export function getGeneratedFile(directory: ServiceDirectory): RequestHandler {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const { jobId } = req.params;

      const fileServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:file-service`);
      const { data } = await axios.get<{ results: FileResult[] }>(`${fileServiceUrl}`, {
        headers: { Authorization: `Bearer ${user.token.bearer}` },
        params: {
          top: 1,
          criteria: { typeEquals: GENERATED_PDF, recordIdEquals: jobId },
        },
      });

      if (!data.results?.length) {
        throw new NotFoundError('Generated PDF', jobId);
      }

      res.send(data.results[0]);
    } catch (err) {
      next(err);
    }
  };
}

export function createPdfRouter({ queueService }: RouterProps): Router {
  const router = Router();

  router.get('/templates', getTemplates);
  router.get(
    '/templates/:templateId',
    createValidationHandler(param('templateId').isString().isLength({ min: 1, max: 50 })),
    getTemplate
  );
  router.post(
    '/templates/:templateId/generate',
    createValidationHandler(
      param('templateId').isString().isLength({ min: 1, max: 50 }),
      body('filename').isString().isLength({ min: 1, max: 50 }),
      body('data').isObject()
    ),
    generatePdf(queueService)
  );
  router.get('/generated/:jobId', createValidationHandler(param('jobId').isUUID()), getGeneratedFile);

  return router;
}
