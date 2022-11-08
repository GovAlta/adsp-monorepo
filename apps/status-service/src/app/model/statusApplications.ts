import { ApplicationData, StaticApplicationData, StatusServiceConfiguration } from './serviceStatus';

export class StatusApplications {
  #statusConfiguration: StatusServiceConfiguration;

  constructor(statusConfiguration: StatusServiceConfiguration) {
    this.#statusConfiguration = statusConfiguration;
  }

  [Symbol.iterator]() {
    // Applications are keyed off of Mongo Object id's.
    const keys = this.#keys();
    return new AppIterator(this.#statusConfiguration, keys);
  }

  #keys = () => {
    return Object.keys(this.#statusConfiguration).filter((id) => /^[a-zA-Z0-9]{24}$/gi.test(id));
  };

  size = (): number => {
    return this.#keys().length;
  };

  forEach = (mapper: (app: ApplicationData) => void): void => {
    for (const a of this) {
      mapper(a);
    }
  };

  map = <T>(mapper: (app: ApplicationData) => T): Array<T> => {
    const result: Array<T> = [];
    for (const a of this) {
      result.push(mapper(a));
    }
    return result;
  };

  get(id: string): StaticApplicationData {
    if (!/^[a-zA-Z0-9]{24}$/gi.test(id)) return null;
    return (this.#statusConfiguration[id] as StaticApplicationData) ?? null;
  }

  find = (appKey: string): StaticApplicationData => {
    const apps = this.filter((a) => a.appKey === appKey);
    return apps.length > 0 ? apps[0] : null;
  };

  filter = (filter: (a: ApplicationData) => boolean): StaticApplicationData[] => {
    const results = [];
    for (const app of this) {
      if (filter(app)) {
        results.push(app);
      }
    }
    return results;
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
    return { done: false, value: app as ApplicationData };
  }
}
