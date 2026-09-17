import * as _ from 'lodash';
// eslint-disable-next-line
export const getProperty: any = (obj: any, propName: string) => {
  if (obj[propName] !== undefined) return obj[propName];
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      const result = getProperty(obj[key], propName);
      if (result !== undefined) return result;
    }
  }
};

// TODO: Typing in this function is inconsistent. Needs to be cleaned up since it's not clear that
// output typing of string[] is correct which could affect downstream code.
export const pickPropertyValues = (obj: unknown, property: string, endWithType?: string) => {
  const cached = readPickCache(obj, property, endWithType);
  if (cached !== undefined) {
    return cached;
  }

  const values = collectPropertyValues(obj, property, endWithType);
  writePickCache(obj, property, endWithType, values);
  return values;
};

// The stepper re-derives every step's scopes from the ui schema on every data change, and each
// derivation walks that step's whole ui schema subtree. The ui schema is immutable for the life of
// a form, so the walk only ever has to happen once per element. Returning the same array each time
// also keeps the result usable as a cache key further down.
const pickCache = new WeakMap<object, Map<string, string[]>>();

const pickCacheKey = (property: string, endWithType?: string): string => `${property}\u0000${endWithType ?? ''}`;

const readPickCache = (obj: unknown, property: string, endWithType?: string): string[] | undefined =>
  typeof obj === 'object' && obj !== null
    ? pickCache.get(obj)?.get(pickCacheKey(property, endWithType))
    : undefined;

const writePickCache = (obj: unknown, property: string, endWithType: string | undefined, values: string[]): void => {
  if (typeof obj !== 'object' || obj === null) {
    return;
  }
  let byKey = pickCache.get(obj);
  if (byKey === undefined) {
    byKey = new Map();
    pickCache.set(obj, byKey);
  }
  byKey.set(pickCacheKey(property, endWithType), values);
};

const collectPropertyValues = (obj: unknown, property: string, endWithType?: string): string[] => {
  let values: string[] = [];
  Object.entries(obj as object).forEach(function ([key, value]) {
    if (key === property) {
      values.push(value as string);
    } else if (_.isObject(value)) {
      // if the object type is equal to end type, we are not going to continue the recursive approach
      if (endWithType && (value as Record<string, unknown>)?.type === endWithType) {
        if (property in value) {
          values.push((value as  Record<string, string>)[property]);
        }
      } else {
        values = [...values, ...pickPropertyValues(value, property, endWithType)];
      }
    } else if (_.isArray(value)) {
      const nextValues = value.map(function (arrayObj: Record<string, unknown>) {
        return pickPropertyValues(arrayObj, property, endWithType);
      });
      values = [...values, ...nextValues.reduce((vs, v) => [...vs, ...v], [])];
    }
  });
  return values;
};
