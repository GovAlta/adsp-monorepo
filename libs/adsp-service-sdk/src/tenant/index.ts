import { Logger } from 'winston';
import { TokenProvider } from '../access';
import { ServiceDirectory } from '../directory';
import { Tenant, TenantService, TenantServiceImpl } from './tenantService';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      tenant?: Tenant;
    }
  }
}

export { createTenantHandler } from './tenantHandler';
export type { Tenant, TenantService } from './tenantService';

interface TenantServiceOptions {
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  logger: Logger;
}

export function createTenantService({ directory, tokenProvider, logger }: TenantServiceOptions): TenantService {
  return new TenantServiceImpl(logger, directory, tokenProvider);
}
