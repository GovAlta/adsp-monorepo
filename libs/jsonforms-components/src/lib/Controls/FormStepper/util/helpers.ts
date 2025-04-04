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
