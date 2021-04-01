import { RequestHandler } from 'express';
// Passport enhances type defs on express types; this is needed for type checking on tests.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as passport from 'passport';
import { UserRole, User } from './types';
import { UnauthorizedError } from './errors';

export const assertAuthenticatedHandler: RequestHandler = (req, res, next) => {
  if (!req.isAuthenticated || !req.user) {
    res.sendStatus(401);
  } else {
    next();
  }
};

type AssertRole = (
  operation: string,
  roles: UserRole | UserRole[]
) => <T extends Function>(
  target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T>;

export const AssertRole: AssertRole = (operation, roles) => (target, propertyKey, descriptor) => {
  const method = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    if (!(roles instanceof Array)) {
      roles = [roles];
    }

    const [user] = args;
    const userRoles = user ? (user as User).roles : [];
    // If user has at least one of the roles, then they are permitted.
    const matchedRoles = roles.filter((required) => userRoles.includes(required));

    if (matchedRoles.length === 0) {
      throw new UnauthorizedError(`User not permitted to ${operation}.`);
    } else {
      return method.apply(this, args);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return descriptor;
};
