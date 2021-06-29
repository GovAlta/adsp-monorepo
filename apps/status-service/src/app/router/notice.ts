import type { User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { MissingParamsError, UnauthorizedError } from '../common/errors';
import { NoticeApplicationEntity } from '../model/notice';
import { NoticeRepository } from '../repository/notice';

export interface NoticeRouterProps {
  logger: Logger;
  noticeRepository: NoticeRepository;
}

export function createNoticeRouter({ logger, noticeRepository }: NoticeRouterProps): Router {
  const router = Router();

  // Get notices by query
  router.get('/', assertAuthenticatedHandler, async (req, res) => {
    logger.info(req.method, req.url);

    const applications = await noticeRepository.find(req.query);
    res.json(applications);
  });

  // Add notice
  router.post('/', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const { message, tennantServRef, startDate, endDate } = req.body;

    const app = await NoticeApplicationEntity.create(noticeRepository, {
      message,
      tennantServRef,
      startDate,
      endDate,
      mode: 'draft',
    });
    res.status(201).json(app);
  });

  // Update notice fields or mode
  router.put('/:id', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const { message, tennantServRef, startDate, endDate, mode } = req.body;
    const { id } = req.params;

    // TODO: this needs to be moved to a service
    const application = await noticeRepository.get(id);

    const updatedApplication = await application.update({
      message,
      tennantServRef,
      startDate,
      endDate,
      mode,
    });
    res.status(200).json(updatedApplication);
  });

  return router;
}
