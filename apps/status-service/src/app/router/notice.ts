import {
  assertAuthenticatedHandler,
  InvalidOperationError,
  NotFoundError,
  UnauthorizedError,
} from '@core-services/core-common';
import { AuditService, EventService, TenantService } from '@abgov/adsp-service-sdk';
import { Router, RequestHandler } from 'express';
import { Logger } from 'winston';
import { NoticeApplicationEntity } from '../model/notice';
import { NoticeRepository } from '../repository/notice';
import { ServiceUserRoles, NoticeModeType } from '../types';
import { applicationNoticePublished } from '../events';
import {
  auditStatus,
  NoticeCreatedAuditAction,
  NoticeDeletedAuditAction,
  NoticeUpdatedAuditAction,
  toNoticeAuditDetails,
} from '../audit';
import type { User } from '@abgov/adsp-service-sdk';

export interface NoticeRouterProps {
  logger: Logger;
  noticeRepository: NoticeRepository;
  eventService?: EventService;
  tenantService: TenantService;
  auditService: AuditService;
}

interface NoticeFilter {
  mode?: NoticeModeType;
  tenantName?: string;
  tenantId?: string;
}

function mapNotice(entity: NoticeApplicationEntity) {
  return entity
    ? {
        id: entity.id,
        message: entity.message,
        startDate: entity.startDate,
        endDate: entity.endDate,
        // temporary to facilitate a rename from active to published
        mode: entity.mode === 'active' ? 'published' : entity.mode,
        created: entity.created,
        tenantId: entity.tenantId?.toString(),
        isAllApplications: entity.isAllApplications,
        tenantName: entity.tenantName,
        tennantServRef:
          typeof entity.tennantServRef === 'string' ? JSON.parse(entity.tennantServRef) : entity.tennantServRef,
      }
    : null;
}

function getUserTenantId(user: User): string {
  if (!user.tenantId) {
    throw new InvalidOperationError('Notice requests require a token with a tenant context.');
  }
  return user.tenantId.toString();
}

function isValidDate(value: unknown): boolean {
  return (typeof value === 'string' || value instanceof Date) && !isNaN(new Date(value).getTime());
}

function validateNoticeBody({ message, tennantServRef, startDate, endDate }: Record<string, unknown>) {
  const errors: string[] = [];
  if (typeof message !== 'string' || !message.trim()) {
    errors.push('message is required');
  }
  if (!Array.isArray(tennantServRef)) {
    errors.push('tennantServRef must be an array');
  }
  if (!isValidDate(startDate)) {
    errors.push('startDate must be a valid date');
  }
  if (!isValidDate(endDate)) {
    errors.push('endDate must be a valid date');
  }
  if (errors.length) {
    throw new InvalidOperationError(`Notice is not valid: ${errors.join(', ')}.`);
  }
}

function validateUpdateDates({ startDate, endDate }: Record<string, unknown>) {
  const errors = Object.entries({ startDate, endDate })
    .filter(([, value]) => value !== undefined && !isValidDate(value))
    .map(([field]) => `${field} must be a valid date`);
  if (errors.length) {
    throw new InvalidOperationError(`Notice is not valid: ${errors.join(', ')}.`);
  }
}

export const getNotices =
  (logger: Logger, tenantService: TenantService, noticeRepository: NoticeRepository): RequestHandler =>
  async (req, res, next) => {
    const { top, after, mode } = req.query;
    const tenantName = typeof req.query.name === 'string' ? req.query.name : undefined;
    const user = req.user as User;

    logger.info(req.method, req.url);
    const anonymous = !user;
    const isAdmin = user && user.roles.includes(ServiceUserRoles.StatusAdmin);
    const filter: NoticeFilter = {};
    filter.mode = 'published';

    try {
      if (!anonymous) {
        filter.tenantId = getUserTenantId(user);
      } else if (tenantName) {
        const tenant = (await tenantService.getTenants()).find(
          (tenant) => tenant.name.toLowerCase() === tenantName.toLowerCase(),
        );
        if (!tenant) {
          throw new NotFoundError('tenant', tenantName);
        }
        filter.tenantId = tenant.id.toString();
      }

      if (isAdmin) {
        filter.mode = mode ? (mode.toString() as NoticeModeType) : null;
      }

      const notices = await noticeRepository.find(
        parseInt(top?.toString()) || 50,
        parseInt(after?.toString()) || 0,
        filter
      );
      res.json({
        page: notices.page,
        results: notices.results.map(mapNotice),
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
      const notice = await noticeRepository.get(id, getUserTenantId(user));

      if (!notice) {
        throw new NotFoundError('Service Notice', id);
      }

      if (notice.canAccessById(user, notice)) {
        res.json(mapNotice(notice));
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
  (logger: Logger, noticeRepository: NoticeRepository, auditService: AuditService): RequestHandler =>
  async (req, res, next) => {
    logger.info(req.method, req.url);
    try {
      const { id } = req.params;
      const user = req.user as User;
      const notice = await noticeRepository.get(id, getUserTenantId(user));

      if (!notice) {
        throw new NotFoundError('Service Notice', id);
      }

      await notice.delete(user);
      auditStatus(auditService, logger, NoticeDeletedAuditAction, user, toNoticeAuditDetails(notice));
      res.json(mapNotice(notice));
    } catch (err) {
      const errMessage = `Error deleting notice: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  };

export const createNotice =
  (
    logger: Logger,
    tenantService: TenantService,
    noticeRepository: NoticeRepository,
    auditService: AuditService,
  ): RequestHandler =>
  async (req, res, next) => {
    logger.info(`${req.method} - ${req.url}`);

    try {
      const { message, startDate, endDate, isAllApplications, tennantServRef } = req.body;
      const user = req.user as User;
      const tenantId = getUserTenantId(user);
      validateNoticeBody(req.body);
      const tenant = await tenantService.getTenant(user.tenantId);

      const notice = await NoticeApplicationEntity.create(user, noticeRepository, {
        message,
        tennantServRef: JSON.stringify(tennantServRef),
        startDate,
        endDate,
        tenantName: tenant.name,
        mode: 'draft',
        created: new Date(),
        isAllApplications: isAllApplications || false,
        tenantId,
      });

      auditStatus(auditService, logger, NoticeCreatedAuditAction, user, toNoticeAuditDetails(notice));
      res.status(201).json(mapNotice(notice));
    } catch (err) {
      const errMessage = `Error creating notice: ${err.message}`;
      logger.error(errMessage);
      next(err);
    }
  };

export const updateNotice =
  (
    logger: Logger,
    eventService: EventService,
    noticeRepository: NoticeRepository,
    auditService: AuditService,
  ): RequestHandler =>
  async (req, res, next) => {
    logger.info(`${req.method} - ${req.url}`);

    const { message, startDate, endDate, mode, isAllApplications } = req.body;
    const { id } = req.params;
    const user = req.user as User;
    const tenantServRef = req.body.tennantServRef;

    try {
      // TODO: this needs to be moved to a service
      const tenantId = getUserTenantId(user);
      validateUpdateDates(req.body);
      const notice = await noticeRepository.get(id, tenantId);
      if (!notice) {
        throw new NotFoundError('Service Notice', id);
      }
      const applicationMode = notice.mode;
      const updatedNotice = await notice.update(user, {
        message,
        tennantServRef: JSON.stringify(tenantServRef),
        startDate,
        endDate,
        mode,
        isAllApplications,
      });

      if (applicationMode !== 'published' && mode === 'published') {
        eventService.send(applicationNoticePublished(notice, user));
      }

      const details = toNoticeAuditDetails({ ...updatedNotice, id });
      auditStatus(auditService, logger, NoticeUpdatedAuditAction, user, {
        ...details,
        metadata: { ...details.metadata, previousMode: applicationMode },
      });
      res.json(mapNotice(updatedNotice));
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
  auditService,
}: NoticeRouterProps): Router {
  const router = Router();

  // Get notices by query
  router.get('/notices', getNotices(logger, tenantService, noticeRepository));
  router.get('/notices/:id', assertAuthenticatedHandler, getNoticeById(logger, noticeRepository));
  router.delete('/notices/:id', assertAuthenticatedHandler, deleteNotice(logger, noticeRepository, auditService));
  // Add notice
  router.post(
    '/notices',
    assertAuthenticatedHandler,
    createNotice(logger, tenantService, noticeRepository, auditService),
  );
  // Update notice fields or mode
  router.patch(
    '/notices/:id',
    assertAuthenticatedHandler,
    updateNotice(logger, eventService, noticeRepository, auditService),
  );

  return router;
}
