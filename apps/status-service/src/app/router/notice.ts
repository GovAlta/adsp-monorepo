import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { Router } from 'express';
import { UrlWithStringQuery } from 'url';
import { Logger } from 'winston';
import { NoticeApplicationEntity } from '../model/notice';
import { NoticeRepository } from '../repository/notice';
import { ServiceUserRoles, NoticeModeType } from '../types';
import { TenantService } from '@abgov/adsp-service-sdk';

export interface NoticeRouterProps {
  logger: Logger;
  noticeRepository: NoticeRepository;
  tenantService: TenantService;
}

interface NoticeFilter {
  mode?: NoticeModeType;
  tenantName?: string;
  tenantId?: string
}

interface applicationRef {
  name?: string;
  id?: UrlWithStringQuery
}

const parseTenantServRef = (tennantServRef?: string | applicationRef[] | null): string => {
  if (!tennantServRef) {
    return JSON.stringify([])
  } else {
    if (typeof tennantServRef !== 'string') {
      return JSON.stringify(tennantServRef)
    }
  }
  return tennantServRef
}

export function createNoticeRouter({ logger, tenantService, noticeRepository }: NoticeRouterProps): Router {
  const router = Router();

  // Get notices by query
  router.get('/notices', async (req, res, next) => {
    const { top, after, mode } = req.query;
    const tenantName = req.query.name
    const user = req.user as Express.User;

    logger.info(req.method, req.url);
    const anonymous = !user;
    const isAdmin = user && user.roles.includes(ServiceUserRoles.StatusAdmin);
    const filter: NoticeFilter = {};
    filter.mode = 'active';

    try {
      if (!anonymous) {
        filter.tenantId = user.tenantId.toString();
      } else {
        if (tenantName) {
          // tenant is an array, but it shall only contain 1 or 0 element

          const tenant = (await tenantService.getTenants())
            .filter((tenant) => { return tenant.name === tenantName });
          console.log(tenant)
          if (tenant) {
            filter.tenantId = tenant[0].id.toString()
          }
        }
      }

      if (isAdmin) {
        filter.mode = mode ? (mode.toString() as NoticeModeType) : null;
      }

      const applications = await noticeRepository.find(
        parseInt(top?.toString()) || 50,
        parseInt(after?.toString()) || 0,
        filter
      );

      res.json({
        page: applications.page,
        results: applications.results.map((result) => ({
          ...result, tennantServRef: JSON.parse(result.tennantServRef),
        })),
      });
    } catch (err) {
      const errMessage = `Error getting notices: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  router.get('/notices/:id', assertAuthenticatedHandler, async (req, res, next) => {
    logger.info(req.method, req.url);
    try {
      const { id } = req.params;
      const user = req.user as Express.User;
      const application = await noticeRepository.get(id, user.tenantId.toString());

      if (!application) {
        throw new NotFoundError('Service Notice', id);
      }

      if (application.canAccessById(user, application)) {
        res.json({ ...application, tennantServRef: JSON.parse(application.tennantServRef) });
      } else {
        throw new UnauthorizedError('User not authorized to get subscribers');
      }
    } catch (err) {
      const errMessage = `Error getting notice: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  router.delete('/notices/:id', assertAuthenticatedHandler, async (req, res, next) => {
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
  router.post('/notices', assertAuthenticatedHandler, async (req, res, next) => {
    logger.info(`${req.method} - ${req.url}`);

    try {
      const { message, startDate, endDate, isAllApplications } = req.body;
      const tennantServRef = parseTenantServRef(req.body.tennantServRef);
      const user = req.user as Express.User;
      const notice = await NoticeApplicationEntity.create(user, noticeRepository, {
        message,
        tennantServRef,
        startDate,
        endDate,
        tenantName: req.tenant.name,
        mode: 'draft',
        created: new Date(),
        isAllApplications: isAllApplications || false,
        tenantId: user.tenantId.toString(),
      });
      res.status(201).json({ ...notice, tennantServRef: JSON.parse(notice.tennantServRef) });
    } catch (err) {
      const errMessage = `Error creating notice: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  // Update notice fields or mode
  router.patch('/notices/:id', assertAuthenticatedHandler, async (req, res, next) => {
    logger.info(`${req.method} - ${req.url}`);

    const { message, startDate, endDate, mode, isAllApplications } = req.body;
    const { id } = req.params;
    const user = req.user as Express.User;
    const tennantServRef = parseTenantServRef(req.body.tennantServRef)

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
        isAllApplications,
      });

      res.status(200).json(
        {
          ...updatedApplication,
          tennantServRef: JSON.parse(updatedApplication.tennantServRef)
        });
    } catch (err) {
      const errMessage = `Error updating notice: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  });

  return router;
}
