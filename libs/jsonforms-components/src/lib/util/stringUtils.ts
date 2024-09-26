import { ControlProps, JsonSchema, extractSchema } from '@jsonforms/core';

/**
 * Sets the first word to be capitalized so that it is sentence cased.
 * @param words
 * @returns sentence word string.
 */
export const capitalizeFirstLetter = (words: string) => {
  const value = words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
  return value;
};

/**
 * Compares the scope name and the label to determine if it matches so that it can be sentence case.
 * @param scope - format eg: '#/properties/firstName'
 * @param label - The label text
 * @returns true if the scope and label matches, otherwise false
 */
export const controlScopeMatchesLabel = (scope: string, label: string) => {
  // Get the property name in the string from the scope
  const splitIdName = scope.replace(' ', '').split('/')?.at(-1)?.toLowerCase() ?? '';
  const labelWithNoSpaces = label.replace(' ', '').toLowerCase();
  return splitIdName === labelWithNoSpaces;
};

/**
 * Gets the label text in sentence case
 * @param scope
 * @param label
 * @returns
 */
export const getLabelText = (scope: string, label: string): string => {
  let labelToUpdate: string = '';

  if (controlScopeMatchesLabel(scope, label || '') && !areAllUppercase(label)) {
    labelToUpdate = capitalizeFirstLetter(label || '');
  } else {
    labelToUpdate = label || '';
  }

  return labelToUpdate;
};

const areAllUppercase = (label: string): boolean => {
  return /^[^a-z]*$/.test(label);
};
const isEmptyBoolean = (schema: JsonSchema, data: unknown): boolean => {
  return schema.type !== undefined && schema.type === 'boolean' && (data === null || data === undefined);
};
const isEmptyNumber = (schema: JsonSchema, data: unknown): boolean => {
  return (
    data === '' ||
    data === undefined ||
    data === null ||
    ((schema.type === 'number' || schema.type === 'integer') && isNaN(+data))
  );
};

export const validateSinWithLuhn = (input: number): boolean => {
  const cardNumber = input.toString();
  const digits = cardNumber.replace(/\D/g, '').split('').map(Number);
  let sum = 0;
  let isSecond = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = digits[i];
    if (isSecond) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }
    sum += digit;
    isSecond = !isSecond;
  }
  return sum % 10 === 0;
};

interface extractSchema {
  errorMessage?: string;
}

/**
 * Check if a required, defined input value is valid. Returns an appropriate
 * error message if not.
 * @param props
 * @returns error message
 */
export const checkFieldValidity = (props: ControlProps): string => {
  const { data, errors: ajvErrors, required, label, uischema, schema } = props;
  const labelToUpdate = getLabelText(uischema.scope, label);
  const extraSchema = schema as JsonSchema & extractSchema;

  if (extraSchema && data && extraSchema?.title === 'Social insurance number') {
    if (!validateSinWithLuhn(data)) {
      return extraSchema.errorMessage;
    }
  }
  if (required) {
    if (data === undefined) return '';

    if (schema) {
      if (isEmptyBoolean(schema, data)) {
        return `${labelToUpdate} is required`;
      }

      if (isEmptyNumber(schema, data)) {
        return `${labelToUpdate} is required`;
      }
    }
  }

  return ajvErrors;
};

/**
 * Check if the date is a valid date/time
 */
export const isValidDate = function (date: Date | string) {
  if (date instanceof Date && isFinite(date.getTime())) {
    return true;
  } else if (typeof date === 'string' && date.length > 0) {
    return true;
  } else {
    return false;
  }
};
