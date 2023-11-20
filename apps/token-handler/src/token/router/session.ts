import { isAllowedUser } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { Store as SessionStore } from 'express-session';

import { ServiceRoles } from '../roles';
import { UserSessionData } from '../types';
import { PassportStatic } from 'passport';

function mapSessionData(data: UserSessionData) {
  return {
    tenantId: data.tenantId?.toString(),
    id: data.id,
    name: data.name,
    email: data.email,
    roles: data.roles,
    expiry: new Date(data['refreshExp'] * 1000),
  };
}

export function getSessionInformation(sessionStore: SessionStore): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      const sessions = [];
      if (isAllowedUser(user, user.tenantId, ServiceRoles.Admin)) {
        // TODO: This is potentially expensive?
        const storedSessions = await new Promise<UserSessionData[]>((resolve, reject) =>
          sessionStore.all((err, data) => (err ? reject(err) : resolve(data as unknown as UserSessionData[])))
        );
        const userTenantId = user.tenantId?.toString();
        for (const storedSession of storedSessions) {
          // Return if tenant ID matches between request user and session data.
          if (userTenantId === storedSession.tenantId?.toString()) {
            sessions.push(mapSessionData(storedSession));
          }
        }
      } else if (user && req.session) {
        sessions.push(mapSessionData(user as UserSessionData));
      }

      res.send(sessions);
    } catch (err) {
      next(err);
    }
  };
}

interface RouterProps {
  passport: PassportStatic;
  sessionStore: SessionStore;
}

export function createSessionRouter({ passport, sessionStore }: RouterProps) {
  const router = Router();

  router.get(
    '/sessions',
    passport.authenticate('tenant', { session: false }),
    assertAuthenticatedHandler,
    getSessionInformation(sessionStore)
  );

  return router;
}
