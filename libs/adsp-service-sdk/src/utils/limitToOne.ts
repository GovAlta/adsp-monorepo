/* eslint-disable @typescript-eslint/no-explicit-any */
type LimitToOne = (
  getKey?: (propertyKey: string, ...args: any[]) => string
) => (
  target: unknown,
  propertyKey: string,
  descriptor: TypedPropertyDescriptor<(...args: unknown[]) => Promise<unknown>>
) => TypedPropertyDescriptor<(...args: any[]) => Promise<any>>;

const results = new WeakMap<object, Record<string, Promise<unknown>>>();

/**
 * Method decorator that limits a method to a single active execution per key.
 * The same promise is used to respond to callers until it is fulfilled.
 *
 * @param {*} [getKey=(propertyKey) => propertyKey]
 * Function to get the key used to determine which executions share an execution.
 * By default only the method name is used.
 */
export const LimitToOne: LimitToOne =
  (getKey = (propertyKey) => propertyKey) =>
  (_target, propertyKey, descriptor) => {
    const original = descriptor.value;

    // This is an async function, and callers will end up with a chained promise rather than the 'cached' one.
    descriptor.value = async function (...args: unknown[]) {
      let promises = results.get(this);
      if (!promises) {
        promises = {};
        results.set(this, promises);
      }

      const key = getKey(propertyKey, ...args);
      let promise = promises[key];

      if (!promise) {
        promise = original.apply(this, args);
        promises[key] = promise;
      }

      try {
        return await promise;
      } finally {
        promises[key] = null;
      }
    };

    return descriptor;
  };
