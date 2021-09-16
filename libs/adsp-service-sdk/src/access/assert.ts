import { User } from './user';
import { GoAError, GoAErrorExtra } from '../utils';
import * as HttpStatusCodes from 'http-status-codes';

export class UnauthorizedUserError extends GoAError {
  constructor(operation: string, user: User, extra?: GoAErrorExtra) {
    super(`User ${user?.name} (ID: ${user?.id}) not permitted to ${operation}.`,
      { statusCode: HttpStatusCodes.FORBIDDEN, ...extra });

    Object.setPrototypeOf(this, UnauthorizedUserError.prototype);
  }
}

type AssertRole = (
  operation: string,
  roles: string | string[]
  // eslint-disable-next-line @typescript-eslint/ban-types
) => <T extends Function>(
    // eslint-disable-next-line @typescript-eslint/ban-types
    target: object,
    propertyKey: string,
    descriptor: TypedPropertyDescriptor<T>
  ) => TypedPropertyDescriptor<T>;

function assertHasRoles(operation: string, user: User, roles: string | string[]): void {
  if (!(roles instanceof Array)) {
    roles = [roles];
  }

  const userRoles = user?.roles || [];
  // If user has at least one of the roles, then they are permitted.
  const matchedRoles = roles.filter((required) => userRoles.includes(required));

  if (matchedRoles.length === 0) {
    throw new UnauthorizedUserError(operation, user);
  }
}

export const AssertRole: AssertRole = (operation, roles) => (_target, _propertyKey, descriptor) => {
  const method = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    const [user] = args;

    // Require a tenant authenticated user.
    if (!(user as User)?.tenantId) {
      throw new UnauthorizedUserError(operation, user as User);
    }

    assertHasRoles(operation, user as User, roles);

    return method.apply(this, args);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return descriptor;
};

export const AssertCoreRole: AssertRole = (operation, roles) => (_target, _propertyKey, descriptor) => {
  const method = descriptor.value;
  descriptor.value = function (...args: unknown[]) {
    const [user] = args;

    if (!(user as User)?.isCore) {
      throw new UnauthorizedUserError(operation, user as User);
    }

    assertHasRoles(operation, user as User, roles);

    return method.apply(this, args);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;

  return descriptor;
};