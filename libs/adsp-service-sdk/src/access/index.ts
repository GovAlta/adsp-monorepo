import type { Logger } from 'winston';
import type { AdspId } from '../utils';
import { TokenProvider, TokenProviderImpl } from './tokenProvider';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      roles: string[];
      tenantId?: AdspId;
      isCore: boolean;
      token: {
        azp: string;
        aud: string;
        iss: string;
        bearer: string;
        [x:string]: unknown;
      }
    }

    interface Request {
      user?: User;
    }
  }
}

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
