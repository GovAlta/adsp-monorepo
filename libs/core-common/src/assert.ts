import { RequestHandler } from 'express';
// Passport enhances type defs on express types; this is needed for type checking on tests.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import * as passport from 'passport';
import { UserRole, User } from './types';
import { UnauthorizedError } from './errors';
import { createLogger } from './logging';
import * as util from 'util';

const logger = createLogger('[Authentication][JWT]', 'info');

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
  // eslint-disable-next-line @typescript-eslint/ban-types
) => <T extends Function>(
  // eslint-disable-next-line @typescript-eslint/ban-types
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

export interface AuthenticationConfig {
  realm?: string;
  client?: string;
  tenantName?: string;
  allowedRoles?: Array<string>;
  roles?: UserRole[];
}

export const authenticateToken = (authConfig: AuthenticationConfig, user) => {
  logger.info(`tenant: ${user.client}`);

  try {
    if (authConfig.realm) {
      const realm = user.tokenIssuer.split('/').slice(-1)[0];
      if (realm !== authConfig.realm) {
        logger.warn(`Expect realm ${authConfig.realm}, but current realm is ${user.realm}`);
        return false;
      }
    }

    if (authConfig.tenantName) {
      if (user.tenantName !== authConfig.tenantName) {
        logger.warn(`Expect tenant ${authConfig.tenantName}, but current tenantName is ${user.tenantName}`);
        return false;
      }
    }

    if (authConfig.client) {
      if (user.client !== authConfig.client) {
        logger.warn(`Expect client ${util.inspect(authConfig.client)}, but current client is ${user.client}`);
        return false;
      }
    }

    if (authConfig.allowedRoles) {
      let hasRole = false;
      for (const role of authConfig.allowedRoles) {
        if (user.roles.includes(role)) {
          hasRole = true;
          break;
        }
      }
      if (!hasRole) {
        logger.warn(`Expect client with role ${authConfig.allowedRoles}, but none of them are found.`);
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error(error);
    return false;
  }
};
