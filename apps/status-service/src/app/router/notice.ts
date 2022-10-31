import { assertAuthenticatedHandler, NotFoundError, UnauthorizedError } from '@core-services/core-common';
import { adspId, EventService, TenantService } from '@abgov/adsp-service-sdk';
import { Router, RequestHandler } from 'express';
import { Logger } from 'winston';
import { NoticeApplicationEntity } from '../model/notice';
import { NoticeRepository } from '../repository/notice';
import { ServiceUserRoles, NoticeModeType } from '../types';
import { applicationNoticePublished } from '../events';
import type { User } from '@abgov/adsp-service-sdk';
import { StatusApplications } from '../model/statusApplications';
import { StatusServiceConfiguration } from '../model';

interface TenantServRef {
  name: string;
  // This is set to the appKey of a status-service application.
  id: string;
}
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

const stringifyTenantServRef = (tenantServRef?: string | TenantServRef[] | null): string => {
  if (!tenantServRef) {
    return JSON.stringify([]);
  } else {
    if (typeof tenantServRef !== 'string') {
      return JSON.stringify(tenantServRef);
    }
  }
  return tenantServRef;
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

      const notices = await noticeRepository.find(
        parseInt(top?.toString()) || 50,
        parseInt(after?.toString()) || 0,
        filter
      );
      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        adspId`${filter.tenantId}`
      );
      const apps = new StatusApplications(configuration);
      res.json({
        page: notices.page,
        results: notices.results.map((result) => ({
          ...result,
          // temporary to facilitate a rename from active to published
          mode: result.mode === 'active' ? 'published' : result.mode,
          tennantServRef: toExternalRef(result.tennantServRef, apps),
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
      const notice = await noticeRepository.get(id, user.tenantId.toString());

      if (!notice) {
        throw new NotFoundError('Service Notice', id);
      }

      if (notice.canAccessById(user, notice)) {
        const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
          user.tenantId
        );
        const apps = new StatusApplications(configuration);
        res.json({ ...notice, tennantServRef: toExternalRef(notice.tennantServRef, apps) });
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
      const notice = await noticeRepository.get(id, user.tenantId.toString());

      if (!notice) {
        throw new NotFoundError('Service Notice', id);
      }

      notice.delete(user);
      res.json(notice);
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
      const { message, startDate, endDate, isAllApplications, tennantServRef } = req.body;
      const user = req.user as User;
      const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
        user.tenantId
      );
      const apps = new StatusApplications(configuration);
      const tenant = await tenantService.getTenant(user.tenantId);

      const tenantServRef = toInternalRef(tennantServRef, apps);

      const notice = await NoticeApplicationEntity.create(user, noticeRepository, {
        message,
        tennantServRef: tenantServRef,
        startDate,
        endDate,
        tenantName: tenant.name,
        mode: 'draft',
        created: new Date(),
        isAllApplications: isAllApplications || false,
        tenantId: user.tenantId.toString(),
      });

      res.status(201).json({ ...notice, tennantServRef: toExternalRef(notice.tennantServRef, apps) });
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

    const configuration = await req.getConfiguration<StatusServiceConfiguration, StatusServiceConfiguration>(
      user.tenantId
    );
    const apps = new StatusApplications(configuration);

    const tenantServRef = toInternalRef(req.body.tennantServRef, apps);

    try {
      // TODO: this needs to be moved to a service
      const notice = await noticeRepository.get(id, user.tenantId.toString());
      if (!notice) {
        throw new NotFoundError('Service Notice', id);
      }
      const applicationMode = notice.mode;
      const updatedApplication = await notice.update(user, {
        message,
        tennantServRef: tenantServRef,
        startDate,
        endDate,
        mode,
        isAllApplications,
      });

      if (applicationMode !== 'published' && mode === 'published') {
        eventService.send(applicationNoticePublished(notice, user));
      }

      res.json({
        ...updatedApplication,
        tennantServRef: toExternalRef(tenantServRef, apps),
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

// Change the app _id to the appKey for communication with the outside world.
const toExternalRef = (internalRef: string, applications: StatusApplications): TenantServRef[] => {
  // the notice may reference zero or more applications.
  const stringRefs = internalRef || '[]';
  const refs: TenantServRef[] = JSON.parse(stringRefs);
  const externalRefs = refs.map((r) => {
    const apps = applications.filter((int) => int._id === r.id);
    if (apps.length > 0) {
      return { name: r.name, id: apps[0].appKey };
    }
  });
  return externalRefs;
};

// Change the appKey to _id, for storage in the DB (to maintain backward compatibility)
const toInternalRef = (externalRefs: TenantServRef[], applications: StatusApplications): string => {
  const internalTenantServRef = externalRefs
    .map((ex) => {
      const apps = applications.filter((a) => a.appKey === ex.id);
      if (apps.length > 0) {
        return { name: ex.name, id: apps[0]._id };
      } else {
        return null;
      }
    })
    .filter((r) => r !== null);
  return stringifyTenantServRef(internalTenantServRef);
};
