import { ApplicationData } from './serviceStatus';

/**
 * Sometimes you want an array,
 * sometimes you want a hash,
 * in the case of the crazy status apps though,
 * to have both is not overly rash.
 */
export class ApplicationList {
  #keys: Array<string>;

  constructor(apps: Record<string, ApplicationData>) {
    this.#keys = Object.keys(apps);
    this.#keys.forEach((k) => {
      this[k] = apps[k];
    });
  }

  [Symbol.iterator]() {
    return new ApplicationIterator(this, this.#keys);
  }

  map = <T>(mapper: (app: ApplicationData) => T): Array<T> => {
    const result: Array<T> = [];
    for (const a of this) {
      result.push(mapper(a));
    }
    return result;
  };

  filter = (tester: (app: ApplicationData) => boolean): Array<ApplicationData> => {
    const result: Array<ApplicationData> = [];
    for (const app of this) {
      if (tester(app)) {
        result.push(app);
      }
    }
    return result;
  };

  forEach = (mapper: (app: ApplicationData) => void): void => {
    for (const a of this) {
      mapper(a);
    }
  };

  static fromArray = (apps: ApplicationData[]): ApplicationList => {
    const result = {};
    apps.forEach((a) => {
      result[a._id] = a;
    });
    return new ApplicationList(result);
  };
}

class ApplicationIterator {
  #apps: ApplicationList;
  #keys: Array<string>;
  #current: number;

  constructor(apps: ApplicationList, keys: Array<string>) {
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
