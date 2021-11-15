import type { Logger } from 'winston';
import type { AdspId } from '../utils';
import { TokenProvider, TokenProviderImpl } from './tokenProvider';
import type { User as BaseUser } from './user';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface User extends BaseUser {}

    interface Request {
      user?: User;
    }
  }
}

export type { User } from './user';

export { isAllowedUser, AssertRole, AssertCoreRole, UnauthorizedUserError } from './assert';
export { createCoreStrategy } from './createCoreStrategy';
export { createTenantStrategy } from './createTenantStrategy';
export type { TokenProvider } from './tokenProvider';

interface TokenProviderOptions {
  serviceId: AdspId;
  clientSecret: string;
  accessServiceUrl: URL;
  logger: Logger;
}

export const createTokenProvider = ({
  serviceId,
  clientSecret,
  accessServiceUrl,
  logger,
}: TokenProviderOptions): TokenProvider => {
  return new TokenProviderImpl(logger, serviceId, clientSecret, accessServiceUrl);
};
