import { User } from './user';
import { AdspId, GoAError, GoAErrorExtra } from '../utils';
import * as HttpStatusCodes from 'http-status-codes';

export class UnauthorizedUserError extends GoAError {
  constructor(operation: string, user: User, extra?: GoAErrorExtra) {
    super(`User ${user?.name} (ID: ${user?.id}) not permitted to ${operation}.`, {
      statusCode: HttpStatusCodes.FORBIDDEN,
      ...extra,
    });

    Object.setPrototypeOf(this, UnauthorizedUserError.prototype);
  }
}

type AssertRole = (
  operation: string,
  roles: string | string[],
  roleProperties?: string | string[],
  allowCore?: boolean
  // eslint-disable-next-line @typescript-eslint/ban-types
) => <T extends Function>(
  // eslint-disable-next-line @typescript-eslint/ban-types
  target: object,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<T>
) => TypedPropertyDescriptor<T>;

function hasRequiredRole(user: User, roles: string | string[]): boolean {
  if (!(roles instanceof Array)) {
    roles = [roles];
  }

  const userRoles = user?.roles || [];
  // If user has at least one of the roles, then they are permitted.
  const matchedRole = roles.find((required) => userRoles.includes(required));
  return !!matchedRole;
}

export function isAllowedUser(user: User, tenantId: AdspId, roles: string | string[], allowCore = false): boolean {
  const isAllowedTenant =
    (allowCore && user?.isCore) || (!!user?.tenantId && (!tenantId || tenantId.toString() === user.tenantId.toString()));

  return isAllowedTenant && hasRequiredRole(user, roles);
}

export const AssertRole: AssertRole =
  (operation, constRoles, roleProperties = [], allowCore = false) =>
  (_target, _propertyKey, descriptor) => {
    const method = descriptor.value;
    descriptor.value = function (...args: unknown[]) {
      const [user] = args as [User, ...unknown[]];

      const roles: string[] = constRoles instanceof Array ? [...constRoles] : constRoles ? [constRoles] : [];
      if (roleProperties) {
        const properties = roleProperties instanceof Array ? [...roleProperties] : [roleProperties];
        const propertyRoles = properties.reduce((values, property) => [...values, ...(this[property] || [])], []);
        roles.push(...propertyRoles);
      }

      // If we don't allow core user or user is not a core user, AND
      // User has no tenant ID or tenant context on this exists and doesn't match user tenant, THEN
      // user is not authorized.
      if (!isAllowedUser(user, this.tenantId, roles, allowCore)) {
        throw new UnauthorizedUserError(operation, user as User);
      }

      return method.apply(this, args);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any;

    return descriptor;
  };

export const AssertCoreRole: AssertRole = (operation, roles) => (_target, _propertyKey, descriptor) => {
  const method = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    const [user] = args as [User, ...unknown[]];

    if (!(user as User)?.isCore || !hasRequiredRole(user, roles)) {
      throw new UnauthorizedUserError(operation, user as User);
    }

    return method.apply(this, args);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return descriptor;
};
