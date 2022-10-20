import { ApplicationData, StaticApplicationData, StatusServiceConfiguration } from './serviceStatus';

export class StatusApplications {
  #statusConfiguration: StatusServiceConfiguration;

  constructor(statusConfiguration: StatusServiceConfiguration) {
    this.#statusConfiguration = statusConfiguration;
  }

  [Symbol.iterator]() {
    return new AppIterator(this.#statusConfiguration, Object.keys(this.#statusConfiguration));
  }

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
    return (this.#statusConfiguration[id] as StaticApplicationData) ?? null;
  }
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
