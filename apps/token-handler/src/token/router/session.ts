import { AdspId, isAllowedUser, User } from '@abgov/adsp-service-sdk';
import { assertAuthenticatedHandler } from '@core-services/core-common';
import * as cors from 'cors';
import { NextFunction, Request, RequestHandler, Response, Router } from 'express';
import { SessionData, Store as SessionStore } from 'express-session';

import { ServiceRoles } from '../roles';
import { UserSessionData } from '../types';
import { PassportStatic } from 'passport';

// Sessions are stored as serialized by passport, with the user under passport.user and the tenant ID as a string.
interface StoredSession extends SessionData {
  passport?: { user?: Omit<UserSessionData, 'tenantId'> & { tenantId: string } };
}

function mapSessionData(data: Omit<UserSessionData, 'tenantId'> & { tenantId?: AdspId | string }) {
  return {
    tenantId: data.tenantId?.toString(),
    id: data.id,
    name: data.name,
    email: data.email,
    roles: data.roles,
    expiry: new Date(data['refreshExp'] * 1000),
    authenticatedBy: data.authenticatedBy,
  };
}

// Bearer token users have the service's client roles by name; session users have them as '<client>:<role>'.
function isSessionAdmin(user: User, serviceId: AdspId): boolean {
  return isAllowedUser(user, user.tenantId, [ServiceRoles.Admin, `${serviceId}:${ServiceRoles.Admin}`]);
}

export function getSessionInformation(sessionStore: SessionStore, serviceId: AdspId): RequestHandler {
  return async function (req: Request, res: Response, next: NextFunction) {
    try {
      const user = req.user;

      const sessions = [];
      if (isSessionAdmin(user, serviceId)) {
        // TODO: This is potentially expensive?
        const storedSessions = await new Promise<StoredSession[]>((resolve, reject) =>
          sessionStore.all((err, data) => (err ? reject(err) : resolve(Object.values(data || {}) as StoredSession[])))
        );
        const userTenantId = user.tenantId?.toString();
        for (const storedSession of storedSessions) {
          const sessionUser = storedSession?.passport?.user;
          // Return if tenant ID matches between request user and session user.
          if (sessionUser && userTenantId === sessionUser.tenantId) {
            sessions.push(mapSessionData(sessionUser));
          }
        }
      } else if (user && (req.session as StoredSession)?.passport?.user?.id === user.id) {
        // Only a user signed in on the session cookie has a session; a bearer token alone doesn't.
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
  serviceId: AdspId;
  sessionStore: SessionStore;
}

export function createSessionRouter({ passport, serviceId, sessionStore }: RouterProps) {
  const router = Router();

  router.get(
    '/sessions',
    cors(),
    // The session strategy passes when there's no signed in user, which ends authentication, so the tenant strategy
    // has to run first for bearer tokens to be accepted.
    passport.authenticate(['tenant', 'session'], { session: false }),
    assertAuthenticatedHandler,
    getSessionInformation(sessionStore, serviceId)
  );

  return router;
}
