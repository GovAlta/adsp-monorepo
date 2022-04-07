import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { EventService, TenantService } from '@abgov/adsp-service-sdk';
import { Router, RequestHandler } from 'express';
import { UrlWithStringQuery } from 'url';
import { Logger } from 'winston';
import { NoticeApplicationEntity } from '../model/notice';
import { NoticeRepository } from '../repository/notice';
import { ServiceUserRoles, NoticeModeType } from '../types';
import { applicationNoticePublished } from '../events';
import type { User } from '@abgov/adsp-service-sdk';

export interface NoticeRouterProps {
  logger: Logger;
  noticeRepository: NoticeRepository;
  eventService?: EventService;
  tenantService: TenantService;
}

interface NoticeFilter {
  mode?: NoticeModeType;
  tenantName?: string;
  tenantId?: string;
}

interface applicationRef {
  name?: string;
  id?: UrlWithStringQuery;
}

const parseTenantServRef = (tennantServRef?: string | applicationRef[] | null): string => {
  if (!tennantServRef) {
    return JSON.stringify([]);
  } else {
    if (typeof tennantServRef !== 'string') {
      return JSON.stringify(tennantServRef);
    }
  }
  return tennantServRef;
};

export const getNotices =
  (logger: Logger, tenantService: TenantService, noticeRepository: NoticeRepository): RequestHandler =>
  async (req, res, next) => {
    const { top, after, mode } = req.query;
    const tenantName = req.query.name as string;
    const user = req.user as User;

    logger.info(req.method, req.url);
    const anonymous = !user;
    const isAdmin = user && user.roles.includes(ServiceUserRoles.StatusAdmin);
    const filter: NoticeFilter = {};
    filter.mode = 'published';

    try {
      if (!anonymous) {
        filter.tenantId = user.tenantId.toString();
      } else {
        if (tenantName) {
          // tenant is an array, but it shall only contain 1 or 0 element
          const tenant = (await tenantService.getTenants()).filter((tenant) => {
            return tenant.name.toLowerCase() === tenantName.toLowerCase();
          });
          if (tenant) {
            filter.tenantId = tenant[0].id.toString();
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
          ...result,
          // temporary to facilitate a rename from active to published
          mode: result.mode === 'active' ? 'published' : result.mode,
          tennantServRef: JSON.parse(result.tennantServRef),
        })),
      });
    } catch (err) {
      const errMessage = `Error getting notices: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  };

export const getNoticeById =
  (logger: Logger, noticeRepository: NoticeRepository): RequestHandler =>
  async (req, res, next) => {
    logger.info(req.method, req.url);
    try {
      const { id } = req.params;
      const user = req.user as User;
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
  };

export const deleteNotice =
  (logger: Logger, noticeRepository: NoticeRepository): RequestHandler =>
  async (req, res, next) => {
    logger.info(req.method, req.url);
    try {
      const { id } = req.params;
      const user = req.user as User;
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
  };

export const createNotice =
  (logger: Logger, tenantService: TenantService, noticeRepository: NoticeRepository): RequestHandler =>
  async (req, res, next) => {
    logger.info(`${req.method} - ${req.url}`);

    try {
      const { message, startDate, endDate, isAllApplications } = req.body;
      const tennantServRef = parseTenantServRef(req.body.tennantServRef);
      const user = req.user as User;
      const tenant = await tenantService.getTenant(user.tenantId);
      const notice = await NoticeApplicationEntity.create(user, noticeRepository, {
        message,
        tennantServRef,
        startDate,
        endDate,
        tenantName: tenant.name,
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
  };

export const updateNotice =
  (logger: Logger, eventService: EventService, noticeRepository: NoticeRepository): RequestHandler =>
  async (req, res, next) => {
    logger.info(`${req.method} - ${req.url}`);

    const { message, startDate, endDate, mode, isAllApplications } = req.body;
    const { id } = req.params;
    const user = req.user as User;
    const tennantServRef = parseTenantServRef(req.body.tennantServRef);

    try {
      // TODO: this needs to be moved to a service
      const application = await noticeRepository.get(id, user.tenantId.toString());
      if (!application) {
        throw new NotFoundError('Service Notice', id);
      }
      const applicationMode = application.mode;
      const updatedApplication = await application.update(user, {
        message,
        tennantServRef,
        startDate,
        endDate,
        mode,
        isAllApplications,
      });

      if (applicationMode !== 'published' && mode === 'published') {
        eventService.send(applicationNoticePublished(application, user));
      }

      res.json({
        ...updatedApplication,
        tennantServRef: JSON.parse(updatedApplication.tennantServRef),
      });
    } catch (err) {
      const errMessage = `Error updating notice: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  };

export function createNoticeRouter({
  logger,
  tenantService,
  noticeRepository,
  eventService,
}: NoticeRouterProps): Router {
  const router = Router();

  // Get notices by query
  router.get('/notices', getNotices(logger, tenantService, noticeRepository));
  router.get('/notices/:id', assertAuthenticatedHandler, getNoticeById(logger, noticeRepository));
  router.delete('/notices/:id', assertAuthenticatedHandler, deleteNotice(logger, noticeRepository));
  // Add notice
  router.post('/notices', assertAuthenticatedHandler, createNotice(logger, tenantService, noticeRepository));
  // Update notice fields or mode
  router.patch('/notices/:id', assertAuthenticatedHandler, updateNotice(logger, eventService, noticeRepository));

  return router;
}
