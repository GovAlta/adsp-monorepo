import { ControlProps, JsonSchema, JsonSchema7, extractSchema } from '@jsonforms/core';
import { invalidSin, sinTitle } from '../common/Constants';

/**
 * Sets the first word to be capitalized so that it is sentence cased.
 * @param words
 * @returns sentence word string.
 */
export const capitalizeFirstLetter = (words: string) => {
  if (!words) return ''; // Handle empty strings
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
  const splitIdName = scope?.replace(' ', '').split('/')?.at(-1)?.toLowerCase() ?? '';
  const labelWithNoSpaces = label?.replace(' ', '').toLowerCase();
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
export const isEmptyBoolean = (schema: JsonSchema, data: unknown): boolean => {
  return schema.type !== undefined && schema.type === 'boolean' && (data === null || data === undefined);
};
export const isEmptyNumber = (schema: JsonSchema, data: unknown): boolean => {
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
 * Gets the required fields in the If/Then/Else json schema condition.
 * @param props - ControlProps
 * @returns - The required field name.
 */
export const getRequiredIfThen = (props: ControlProps) => {
  const { path } = props;
  const rootSchema = props.rootSchema as JsonSchema7;
  let rootRequired: string[] = [];

  if (rootSchema?.allOf) {
    (rootSchema?.allOf as JsonSchema7[])?.forEach((el: JsonSchema7) => {
      if (el.if && el.then && el.then?.required) {
        const foundIfThenRequired = el.then?.required?.find((req) => req === path);
        if (foundIfThenRequired !== undefined) {
          rootRequired = [...rootRequired, foundIfThenRequired];
        }
      }
      if (el.if && el.else) {
        const foundIfElseRequired = el.else?.required?.find((req) => req === path);
        if (foundIfElseRequired !== undefined) {
          rootRequired = [...rootRequired, foundIfElseRequired];
        }
      }
    });
  }

  if (rootSchema?.if) {
    if (rootSchema?.then && rootSchema?.then?.required) {
      const foundRequired = rootSchema.then?.required?.find((req) => req === path);
      if (foundRequired !== undefined) {
        rootRequired = [...rootRequired, foundRequired];
      }
      if (rootSchema?.else && rootSchema?.else?.required) {
        const foundIfElseRequired = rootSchema.else?.required?.find((req) => req === path);
        if (foundIfElseRequired !== undefined) {
          rootRequired = [...rootRequired, foundIfElseRequired];
        }
      }
    }
  }

  return rootRequired;
};

/**
 * Check if a required, defined input value is valid. Returns an appropriate
 * error message if not.
 * @param props
 * @returns error message
 */
export const checkFieldValidity = (props: ControlProps): string => {
  const { data, errors: ajvErrors, required, label, schema } = props;
  const labelToUpdate = label;
  const extraSchema = schema as JsonSchema & extractSchema;

  if (extraSchema && data && extraSchema?.title === sinTitle) {
    if (data.length === 11 && !validateSinWithLuhn(data)) {
      return data === '' ? '' : invalidSin;
    } else if (data.length > 0 && data.length < 11) {
      return extraSchema.errorMessage;
    }
  }

  const rootRequired = getRequiredIfThen(props);

  if (required || rootRequired.length > 0) {
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

/**
 * Extracts the last segment from a JSON pointer string.
 *
 * @param pointer - The JSON pointer string (e.g., "#/properties/incomeThreshold").
 * @returns The last segment of the JSON pointer or undefined if the pointer is invalid.
 */

export const getLastSegmentFromPointer = (pointer: string): string => {
  if (!pointer.startsWith('#/')) {
    throw new Error("Invalid JSON pointer. Must start with '#/'");
  }

  // Split the pointer into segments and return the last one
  const segments = pointer.split('/');
  return segments[segments.length - 1];
};

/**
 * Converts a camelCase or PascalCase string to a human-readable format
 * with each word capitalized.
 *
 * @param input - The camelCase or PascalCase string (e.g., "incomeThresholdExample").
 * @returns A formatted string with spaces and capitalization (e.g., "Income Threshold Example").
 */
export const convertToReadableFormat = (input: string): string => {
  if (!input) {
    return input;
  }

  return input
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

/**
 * Converts a input to sentence case (eg: incomeThresholdExample or IncomeThresholdExample)
 * to 'Income threshold example' with the first letter in the sentence capitalized.
 *
 * @param input - The camelCase or PascalCase string (e.g., "incomeThresholdExample").
 * @returns A formatted string with spaces and capitalization (e.g., "Income threshold example").
 */
export const convertToSentenceCase = (input: string) => {
  if (!input) {
    return input;
  }

  const convertedInput = convertToReadableFormat(input);

  if (!convertedInput) return convertedInput;

  const firstWord = convertedInput.split(' ').splice(0, 1);
  const newWords = convertedInput
    .split(' ')
    .splice(1)
    .map((word) => word.charAt(0).toLowerCase() + word.slice(1).toLowerCase())
    .join(' ');

  return firstWord.concat(newWords).join(' ');
};
