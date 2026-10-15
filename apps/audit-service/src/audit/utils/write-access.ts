import { AdspId, isAllowedUser, UnauthorizedUserError, User } from '@abgov/adsp-service-sdk';
import { InvalidOperationError } from '@core-services/core-common';
import { RequestHandler } from 'express';

import { AuditServiceRoles } from '../roles';

export function getWriterClientId(user: User): AdspId {
  const clientId = user?.token?.azp;
  if (!AdspId.isAdspId(clientId)) {
    throw new UnauthorizedUserError('write audit events without a service client URN', user);
  }
  const id = AdspId.parse(clientId);
  if (id.type !== 'service') {
    throw new UnauthorizedUserError('write audit events without a service client URN', user);
  }
  return id;
}

export const assertCanWriteEvents: RequestHandler = (req, _res, next) => {
  try {
    if (!isAllowedUser(req.user, req.tenant?.id, AuditServiceRoles.Writer, true)) {
      throw new UnauthorizedUserError('write audit events', req.user);
    }
    const clientId = getWriterClientId(req.user);
    if (!req.user.isCore && clientId.service !== req.params.namespace) {
      throw new UnauthorizedUserError('write audit events in another namespace', req.user);
    }
    if (!req.tenant?.id) {
      throw new InvalidOperationError('Tenant context is required to write audit events.');
    }
    next();
  } catch (err) {
    next(err);
  }
};
