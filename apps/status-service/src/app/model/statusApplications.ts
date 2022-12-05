import { isApp } from '../../mongo/schema';
import { StaticApplicationData, StatusServiceApplications, StatusServiceConfiguration } from './serviceStatus';

export class StatusApplications {
  #apps: StatusServiceApplications;

  constructor(statusConfiguration: StatusServiceApplications) {
    const keys = Object.keys(statusConfiguration);
    const apps = {};
    keys.forEach((k) => {
      if (isApp(statusConfiguration[k])) {
        apps[k] = statusConfiguration[k];
      }
    });
    this.#apps = apps;
  }

  [Symbol.iterator]() {
    const keys = Object.keys(this.#apps);
    return new AppIterator(this.#apps, keys);
  }

  size = (): number => {
    return Object.keys(this.#apps).length;
  };

  forEach = (mapper: (app: StaticApplicationData) => void): void => {
    for (const a of this) {
      mapper(a);
    }
  };

  map = <T>(mapper: (app: StaticApplicationData) => T): Array<T> => {
    const result: Array<T> = [];
    for (const a of this) {
      result.push(mapper(a));
    }
    return result;
  };

  get(id: string): StaticApplicationData {
    return this.#apps[id] ?? null;
  }

  find = (appKey: string): StaticApplicationData => {
    const apps = this.filter((a) => a.appKey === appKey);
    return apps.length > 0 ? apps[0] : null;
  };

  filter = (filter: (a: StaticApplicationData) => boolean): StaticApplicationData[] => {
    const results = [];
    for (const app of this) {
      if (filter(app)) {
        results.push(app);
      }
    }
    return results;
  };

  static fromArray = (apps: StaticApplicationData[]): StatusApplications => {
    const result: StatusServiceApplications = {};
    apps.forEach((a) => {
      result[a.appKey] = a;
    });
    return new StatusApplications(result);
  };
}

class AppIterator {
  #apps: StatusServiceConfiguration;
  #keys: Array<string>;
  #current: number;

  constructor(apps: StatusServiceConfiguration, keys: Array<string>) {
    this.#apps = apps;
    this.#keys = keys;
    this.#current = 0;
  }

  next() {
    if (this.#current >= this.#keys.length) {
      return { done: true, value: undefined };
    }
    const app = this.#apps[this.#keys[this.#current++]];
    return { done: false, value: app as StaticApplicationData };
  }
}
