import { ControlProps } from '@jsonforms/core';

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
  if (splitIdName === labelWithNoSpaces) {
    return true;
  }
  return false;
};

/**
 * Gets the label text in sentence case
 * @param scope
 * @param label
 * @returns
 */
export const getLabelText = (scope: string, label: string): string => {
  let labelToUpdate: string = '';

  if (controlScopeMatchesLabel(scope, label || '')) {
    labelToUpdate = capitalizeFirstLetter(label || '');
  } else {
    labelToUpdate = label || '';
  }

  return labelToUpdate;
};
// This message is thrown when the isNotEmpty  is triggered by Ajv checkInput.ts configuration
export const FIELD_REQUIRED = 'data should pass "isNotEmpty" keyword validation';

/**
 * Gets the error to display when there are validation messages.
 * @param props
 * @returns error message
 */
export const getErrorsToDisplay = (props: ControlProps) => {
  const { data, errors: ajvErrors, required, label, uischema, schema } = props;
  const labelToUpdate = getLabelText(uischema.scope, label);

  if (required) {
    if (data === undefined) return '';

    if (schema) {
      if (schema.type !== undefined && schema.type === 'boolean' && (data === null || data === undefined)) {
        return `${labelToUpdate} is required`;
      }

      if (data === '' || ((schema.type === 'number' || schema.type === 'integer') && isNaN(+data))) {
        return `${labelToUpdate} is required`;
      }
    }

    if (data.toString().length > 0 && ajvErrors.length > 0) return ajvErrors;

    return ajvErrors;
  }

  return ajvErrors.length > 0 ? ajvErrors : '';
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
