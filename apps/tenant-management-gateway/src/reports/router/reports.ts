import { createValidationHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { RequestHandler, Router } from 'express';
import { param, query } from 'express-validator';
import { Logger } from 'winston';
import { resolveReportPeriod } from '../period';
import { ReportCatalog, ReportSectionId } from '../types';

export interface ReportsRouterProps {
  logger: Logger;
  catalog: ReportCatalog;
}

export function getReportSection(catalog: ReportCatalog, logger: Logger): RequestHandler {
  return async (req, res, next) => {
    try {
      const authorization = req.headers.authorization || '';
      if (!/^Bearer\s+\S+/i.test(authorization)) {
        throw new UnauthorizedError('Bearer token is required.');
      }

      const serviceId = String(req.params.serviceId);
      const sectionId = String(req.params.sectionId) as ReportSectionId;
      const from = String(req.query.from);
      const to = String(req.query.to);
      const period = resolveReportPeriod(from, to);
      const handler = catalog[serviceId]?.[sectionId];

      if (!handler) {
        throw new NotFoundError('report section', `${serviceId}/${sectionId}`);
      }

      logger.debug(`GET /reports/${serviceId}/${sectionId} ${period.from}..${period.to}`, {
        context: 'ReportsRouter',
      });

      const data = await handler({
        serviceId,
        sectionId,
        period,
        token: authorization,
      });

      res.json({
        serviceId,
        sectionId,
        period,
        data,
      });
    } catch (err) {
      next(err);
    }
  };
}

export function createReportsRouter({ logger, catalog }: ReportsRouterProps): Router {
  const router = Router();

  router.get(
    '/reports/:serviceId/:sectionId',
    createValidationHandler(
      param('serviceId').isString().isLength({ min: 1, max: 50 }),
      param('sectionId').isString().isLength({ min: 1, max: 50 }),
      query('from').isString().matches(/^\d{4}-\d{2}-\d{2}$/),
      query('to').isString().matches(/^\d{4}-\d{2}-\d{2}$/),
      query('preset').optional().isString()
    ),
    getReportSection(catalog, logger)
  );

  return router;
}
