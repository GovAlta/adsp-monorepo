import * as NodeCache from 'node-cache';
import { Logger } from 'winston';
import { StaticApplicationData } from '../model';

/**
 * ApplicationCache: The application definition is stored in the configuration
 * service. However, when an app is first created/saved, the configuration-service
 * cache may not be immediately refreshed.  Normally, the refresh is immediate, but
 * there are enough exceptions to this that it can be annoying to the end user, who
 * just added an application and the name comes back as 'unknown'.  So the status-
 * service will cache new and updated application values to avoid this delay.
 */
export class ApplicationCache {
  #nodeCache: NodeCache;

  constructor() {
    this.#nodeCache = new NodeCache({
      // after 10 minutes the configuration-service cache should be caught up.
      stdTTL: 600,
      checkperiod: 70,
    });
  }

  get = (key: string, logger: Logger = null): StaticApplicationData => {
    // weird, but it needs to be cast.
    const app = this.#nodeCache.get(key.toString()) as StaticApplicationData;
    if (logger) {
      logger.info(`################## ApplicationCache: fetching app with key(${key}) ${app ? 'succeeded' : 'failed'}`);
    }
    return app;
  };

  put = (app: StaticApplicationData, logger: Logger = null) => {
    if (logger) {
      logger.info(`################## ApplicationCache: caching app with key(${app._id})}`);
    }
    this.#nodeCache.set(app._id.toString(), app);
  };

  contains = (key: string) => {
    this.#nodeCache.has(key);
  };
}
