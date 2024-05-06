import { LabelDescription } from '@jsonforms/core';

type jsonformsLabel = string | boolean | LabelDescription | undefined;
export const labelToString = (label: jsonformsLabel, scope: string): string => {
  if (!label) {
    return resolveLabelFromScope(scope);
  }
  if (typeof label === 'object' && label !== null && 'show' in label && label.show) {
    return label.text ? label.text : resolveLabelFromScope(scope);
  }
  if (typeof label === 'string') {
    return label;
  }
  return '';
};

const resolveLabelFromScope = (scope: string): string => {
  // eslint-disable-next-line no-useless-escape
  const validPatternRegex = /^#(\/properties\/[^\/]+)+$/;
  const isValid = validPatternRegex.test(scope);
  if (!isValid) return '';

  const fieldName = scope.split('/').pop();

  if (fieldName) {
    const lowercased = fieldName.replace(/([A-Z])/g, ' $1').toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }
  return '';
};

export interface InputValue {
  type: 'primitive' | 'object';
  value?: string | string[][];
}

/*
 * Convert object to an array like [[ke1, value1], [key2, value2]]
 * Note: this handles nested objects.
 */
const objToArray = (obj: object): NestedStringArray => {
  return Object.entries(obj).map(([key, value]) => {
    if (typeof value === 'object' && !Array.isArray(value)) {
      return [key, objToArray(value)];
    }
    return [key, value];
  });
};

type NestedStringArray = string[] | NestedStringArray[];

// test for ['name', 'fred']
const isNameValuePair = (value: NestedStringArray): boolean => {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && typeof value[1] === 'string';
};

// test for: ['name', [['first', 'fred'], ['middle', 'jolly'], ['last', 'mcguire']]];
const isNestedValue = (value: NestedStringArray): boolean => {
  return Array.isArray(value) && value.length === 2 && typeof value[0] === 'string' && Array.isArray(value[1]);
};

/*
 * Convert ['name', [['first', 'fred'], ['middle', 'jolly'], ['last', 'mcguire']]]
 * into [['first', 'fred'], ['middle', 'jolly'], ['last', 'mcguire']]
 */
const flatten = (arr: NestedStringArray): string[][] => {
  return arr.reduce<string[][]>((acc, val) => {
    if (typeof val === 'string') {
      return acc;
    }
    if (isNestedValue(val)) {
      const flatter = flatten(val[1] as NestedStringArray);
      return acc.concat(flatter);
    }
    // If the current value is a string, add it to the accumulator
    if (isNameValuePair(val)) {
      return acc.concat([val as string[]]);
    }
    return acc;
  }, []);
};

/*
 * Flatten(objToArray(currentValue))
 * Might have to be revisited.  It currently looses information that may be
 * deemed to be important later on - i.e. if an object contains nested objects,
 * such as { person: { name: 'fred', 'address':'calgary' }, isRich: false }
 * then the 'person' identifier is lost, resulting in
 * [['name', 'fred'], ['address', 'calgary'], ['isRich', 'false']]
 *
 * However, we need to decide how to handle these sorts of nested data in the summary
 * page before messing with it.
 */
export const getFormFieldValue = (scope: string, data: unknown): InputValue => {
  const pathArray = scope.replace('#/properties/', '').replace('properties/', '').split('/');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let currentValue: any = data;
  for (const key of pathArray) {
    if (!currentValue) break;
    currentValue = currentValue[key];
  }
  return typeof currentValue === 'object'
    ? { type: 'object', value: flatten(objToArray(currentValue)) }
    : { type: 'primitive', value: getValue(currentValue) };
};

const getValue = (currentValue: unknown): string | undefined => {
  if (typeof currentValue === 'boolean') {
    return currentValue ? 'Yes' : 'No';
  }
  return currentValue ? String(currentValue) : undefined;
};
