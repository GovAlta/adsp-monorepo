import { RequestHandler } from 'express';
import { hasRequiredRole, UnauthorizedUserError } from './assert';
import { User } from './user';

/**
 * authorize
 * Returns Express middleware that enforces role-based access control using the
 * roles resolved by the SDK's Passport strategies. Passes an UnauthorizedUserError
 * to next() when the authenticated user lacks at least one of the required roles,
 * which the createErrorHandler middleware maps to a 403 response.
 *
 * @param roles One or more role strings; user must have at least one.
 */
export function authorize(...roles: string[]): RequestHandler {
  return (req, _res, next) => {
    const user = req.user as User;

    if (!user) {
      return next(new UnauthorizedUserError('access resource', { id: 'anonymous', name: 'anonymous' } as User));
    }

    if (!hasRequiredRole(user, roles)) {
      return next(new UnauthorizedUserError('access resource', user));
    }

    next();
  };
}
