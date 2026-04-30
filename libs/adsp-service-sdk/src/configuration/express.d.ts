import type { AdspId } from '../utils';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /**
       * Retrieves latest configuration revision for service initialized with SDK.
       * Configuration is retrieved from {service namespace}:{service}.
       */
      getConfiguration?: <C, R = [C, C]>(tenantId?: AdspId) => Promise<R>;

      /**
       * Retrieves active configuration revision, with fallback to latest, for service initialized with SDK.
       * Note that configuration is retrieved from {service}:{name} if useNamespace is true in SDK initialization.
       */
      getServiceConfiguration?: <C, R = [C, C, number?]>(name?: string, tenantId?: AdspId) => Promise<R>;
    }
  }
}

export {};
