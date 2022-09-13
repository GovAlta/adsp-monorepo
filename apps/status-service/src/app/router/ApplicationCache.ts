import * as NodeCache from 'node-cache';
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
      // after 60 seconds the configuration-service cache should be caught up.
      stdTTL: 60,
      checkperiod: 70,
    });
  }

  get = (key: string): StaticApplicationData => {
    // weird, but it needs to be cast.
    return this.#nodeCache.get(key.toString()) as StaticApplicationData;
  };

  put = (key: string, app: StaticApplicationData) => {
    this.#nodeCache.set(key.toString(), app);
  };

  contains = (key: string) => {
    this.#nodeCache.has(key);
  };
}
