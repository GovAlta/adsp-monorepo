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

// eslint-disable-next-line
export const pickPropertyValues = (obj: any, property: string, endWithType?: string) => {
  let values: string[] = [];
  Object.keys(obj).forEach(function (key) {
    if (key === property) {
      values.push(obj[key]);
    } else if (_.isObject(obj[key])) {
      // if the object type is equal to end type, we are not going to continue the recursive approach
      if (endWithType && obj[key]?.type === endWithType) {
        if (obj[key]) {
          values.push(obj[key]);
        }
      } else {
        values = [...values, ...pickPropertyValues(obj[key], property)];
      }
    } else if (_.isArray(obj[key])) {
      const nextValues = obj[key].map(function (arrayObj: object) {
        return pickPropertyValues(arrayObj, property);
      });
      values = [...values, ...nextValues];
    }
  });
  return values;
};
