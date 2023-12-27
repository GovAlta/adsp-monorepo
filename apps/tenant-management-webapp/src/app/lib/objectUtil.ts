/* eslint-disable @typescript-eslint/no-explicit-any */
export function areObjectsEqual<T extends Record<string, any>>(obj1: T, obj2: T): boolean {
  if (!obj1 || !obj2) return false;

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) {
    return false;
  }

  for (const key of keys1) {
    const val1 = obj1[key];
    const val2 = obj2[key];

    const areBothObjects = isObject(val1) && isObject(val2);
    if ((areBothObjects && !areObjectsEqual(val1, val2)) || (!areBothObjects && !areValuesEqual(val1, val2))) {
      return false;
    }
  }

  return true;
}

const isObject = (obj: any): boolean => obj != null && typeof obj === 'object';

const areValuesEqual = (value1: any, value2: any): boolean => {
  if (Array.isArray(value1) && Array.isArray(value2)) {
    return compareStringArrayAreEqual(value1, value2);
  }
  return value1 === value2;
};

export const compareStringArrayAreEqual = (arr1: any[], arr2: any[]): boolean => {
  if (arr1.length !== arr2.length) {
    return false;
  }
  for (let i = 0; i < arr1.length; i++) {
    if (!areObjectsEqual(arr1[i], arr2[i])) {
      return false;
    }
  }
  return true;
};
