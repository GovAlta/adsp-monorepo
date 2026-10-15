import { isAllowedUser, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { RequestHandler } from 'express';
import { AuditServiceRoles } from '../roles';

export function requireAuditRole(role: AuditServiceRoles): RequestHandler {
  return (req, _res, next) => {
    const tenantId = req.tenant?.id;
    if ((!req.user?.isCore && !tenantId) || !isAllowedUser(req.user, tenantId, role, true)) {
      next(new UnauthorizedUserError(`access audit data requiring ${role}`, req.user));
      return;
    }
    next();
  };
}
