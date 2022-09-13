import * as NodeCache from 'node-cache';
import { StaticApplicationData } from '../model';

export class ApplicationCache {
  #nodeCache: NodeCache;

  constructor() {
    this.#nodeCache = new NodeCache({
      // after 30 seconds the configuration manager cache should be caught up.
      stdTTL: 30,
      checkperiod: 60,
    });
  }

  get = (key: string): StaticApplicationData => {
    // weird, but it needs to be cast.
    return this.#nodeCache.get(key.toString());
  };

  put = (key: string, app: StaticApplicationData) => {
    this.#nodeCache.set(key.toString(), app);
  };

  contains = (key: string) => {
    this.#nodeCache.has(key);
  };
}
