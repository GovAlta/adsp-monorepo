import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Router } from 'express';
import { Logger } from 'winston';
import { NoticeApplicationEntity } from '../model/notice';
import { NoticeRepository } from '../repository/notice';
import { ServiceUserRoles, NoticeModeType } from '../types';

export interface NoticeRouterProps {
  logger: Logger;
  noticeRepository: NoticeRepository;
}

interface NoticeFilter {
  mode?: NoticeModeType,
  tenantId?: string
}

export function createNoticeRouter({ logger, noticeRepository }: NoticeRouterProps): Router {
  const router = Router();

  // Get notices by query
  router.get('/', async (req, res, next) => {
    const { top, after, mode } = req.query;
    const user = req.user as Express.User;

    logger.info(req.method, req.url);
    const anonymous = !user || !user.roles.includes(ServiceUserRoles.StatusAdmin)
    const filter: NoticeFilter = {}

    if (anonymous) {
      filter.mode = 'active'
    } else {
      filter.mode = mode? mode.toString() as NoticeModeType: null
      filter.tenantId = user.tenantId.toString()
    }

    try {
      const applications = await noticeRepository.find(
        parseInt((top as string) || '50', 50),
        after as string,
        filter
      );

      res.json({
        page: applications.page,
        results: applications.results
          .sort((a, b) => (b.created > a.created ? 1 : -1))
          .map((result) => ({
            id: result.id,
            message: result.message,
            tennantServRef: result.tennantServRef,
            startDate: result.startDate,
            endDate: result.endDate,
            mode: result.mode,
            created: result.created,
            tenantId: result.tenantId
          })),
      });
    } catch (err) {
      const errMessage = `Error getting notices: ${err.message}`;
      logger.error(errMessage);

      next(err);
    }
  });

  router.get('/:id', assertAuthenticatedHandler, async (req, res, next) => {
    logger.info(req.method, req.url);
    try {
      const { id } = req.params;
      const user = req.user as Express.User;
      const application = await noticeRepository.get(id, user.tenantId.toString());

      if (!application) {
        throw new NotFoundError('Service Notice', id);
      }

      if (application.canAccessById(user, application)) {
        res.json(application);
      } else {
        throw new UnauthorizedError('User not authorized to get subscribers');
      }
    } catch (err) {
      const errMessage = `Error getting notice: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  router.delete('/:id', assertAuthenticatedHandler, async (req, res, next) => {
    logger.info(req.method, req.url);

    try {
      const { id } = req.params;
      const user = req.user as Express.User;

      const application = await noticeRepository.get(id, user.tenantId.toString());

      if (!application) {
        throw new NotFoundError('Service Notice', id);
      }

      application.delete(user);
      res.json(application);
    } catch (err) {
      const errMessage = `Error deleting notice: ${err.message}`;

      logger.error(errMessage);
      next(err);
    }
  });

  // Add notice
  router.post('/', assertAuthenticatedHandler, async (req, res) => {
    logger.info(`${req.method} - ${req.url}`);

    const { message, tennantServRef, startDate, endDate } = req.body;
    const user = req.user as Express.User;
    const app = await NoticeApplicationEntity.create(user, noticeRepository, {
      message,
      tennantServRef,
      startDate,
      endDate,
      mode: 'draft',
      created: new Date(),
      tenantId: user.tenantId.toString()
    });
    res.status(201).json(app);
  });

  // Update notice fields or mode
  router.patch('/:id', assertAuthenticatedHandler, async (req, res, next) => {
    logger.info(`${req.method} - ${req.url}`);

    const { message, tennantServRef, startDate, endDate, mode } = req.body;
    const { id } = req.params;
    const user = req.user as Express.User;

    try {
      // TODO: this needs to be moved to a service
      const application = await noticeRepository.get(id, user.tenantId.toString());

      if (!application) {
        throw new NotFoundError('Service Notice', id);
      }

      const updatedApplication = await application.update(user, {
        message,
        tennantServRef,
        startDate,
        endDate,
        mode,
      });
      res.status(200).json(updatedApplication);
    } catch (err) {
      const errMessage = `Error updating notice: ${err.message}`;
      logger.error(errMessage);

      next(err);
    }
  });

  return router;
}
