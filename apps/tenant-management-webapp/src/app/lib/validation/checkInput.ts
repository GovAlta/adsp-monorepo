/**
 * CheckInput
 *
 * Used to check for clean input.  It works on a list of validators, each one
 * performing a different check.  There are character and word validators defined
 * here, but there can be others.
 *
 *
 * Usage:
 *  const error = checkInput(input, [validator])
 *
 * Optional Parameters:
 *   1. An action, for sophisticated input handling. See the reactInputHandlerFactory
 *      as an example.
 *      checkInput(input, [validator], inputHandler)
 *
 * There are some canned validators that can be used:
 *   1. The character check: checks that the input matches a regular expression.
 *      Some common validation patterns are in the validationPatterns object below.
 *
 *   2. The word check: checks that the input does not match anything on a list
 *      of forbidden words.
 *
 */
import { standardV1JsonSchema, commonV1JsonSchema } from '@abgov/data-exchange-standard';
import { createDefaultAjv } from '@abgov/jsonforms-components';
import * as schemaMigration from 'json-schema-migrate';

export interface ValidInput {
  pattern: RegExp;
  onFailureMessage: string;
}

export const ajv = createDefaultAjv(standardV1JsonSchema, commonV1JsonSchema);

ajv.addKeyword({
  keyword: 'isNotEmpty',
  validate: function (_schema, data: string) {
    return typeof data === 'string' && data.trim() !== '';
  },
  // This will get checked again in our GoA JsonForm controls to render user friendly error message
  errors: true,
});

/**
 * Given a list of validators and name of the input field, report on its cleanliness
 */
export const checkInput = (input: unknown, validators: Validator[], action?: ValidationAction): string => {
  if (!action) {
    action = nonAction;
  }
  for (let i = 0; i < validators.length; i++) {
    const message = validators[i](input);
    if (message) {
      action.onFailure(message);
      return message;
    }
    if (action.onSuccess) {
      action.onSuccess();
    }
  }
  return '';
};

/* Some common character cleansing patterns */
export const validationPattern = {
  mixedKebabCase: {
    pattern: new RegExp(/^[a-zA-Z0-9-_]+$/),
    onFailureMessage: 'Allowed characters are: a-z, A-Z, 0-9, -, _',
  },
  mixedArrowCaseWithSpace: {
    pattern: new RegExp(/^[a-zA-Z0-9- ]+$/),
    onFailureMessage: 'Allowed characters are: a-z, A-Z, 0-9, -, [space]',
  },
  lowerKebabCase: { pattern: new RegExp(/^[a-z0-9-]+$/), onFailureMessage: 'Allowed characters are: a-z, 0-9, -' },
  upperKebabCase: { pattern: new RegExp(/^[A-Z0-9-]+$/), onFailureMessage: 'Allowed characters are: A-Z, 0-9, -' },
  validURL: { pattern: new RegExp(/^(http|https):\/\/[^ "]+$/), onFailureMessage: 'Please enter a valid URL' },
  validURLOnlyDomain: {
    pattern: new RegExp(/^((http|https):\/\/(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,})([^/\s]*)?$/),
    onFailureMessage: 'Please enter a valid URL',
  },
  validEmail: {
    pattern: new RegExp(/^\w+(?:[.-]\w+)*@\w+(?:[.-]\w+)*(?:\.\w{2,3})+$/),
    onFailureMessage: 'Please enter a valid email address',
  },
  validSms: {
    pattern: new RegExp(/^\d{10}$/),
    onFailureMessage: 'Please enter a valid 10 digit phone number ie. 7801234567',
  },
  validContact: {
    pattern: new RegExp(/^(?:\w+(?:[.-]\w+)*@\w+(?:[.-]\w+)*(?:\.\w{2,3})|\d{10})$/),
    onFailureMessage: 'Please enter a valid email address or 10 digit phone number (e.g., 7801234567)',
  },
};

export type Validator = (input) => string;

/* Some common validators */
export const characterCheck = (validationPattern: ValidInput): Validator => {
  return (input: string) => {
    if (input) {
      return !validationPattern.pattern.test(input) ? validationPattern.onFailureMessage : '';
    }
    return '';
  };
};

export const badCharsCheck = characterCheck(validationPattern.mixedArrowCaseWithSpace);
export const badCharsCheckNoSpace = characterCheck(validationPattern.mixedKebabCase);
export const wordCheck = (forbidden: string[]): Validator => {
  return (input: string) => {
    return forbidden.some((e) => e === input) ? `${input} is forbidden` : '';
  };
};

export const isNotEmptyCheck = (label: string): Validator => {
  return (input: string) => {
    return input.length > 0 ? '' : `${label} is required`;
  };
};

export const isNotUndefinedCheck = (value: string, label: string): Validator => {
  return (input: string) => {
    return input !== undefined ? '' : `${label} is required`;
  };
};

export const isValidJSONCheck = (label?: string): Validator => {
  return (str: string) => {
    try {
      JSON.parse(str);
      return '';
    } catch (err) {
      return `${capitalize(label)} is invalid for JSON string`;
    }
  };
};

export const wordMaxLengthCheck = (maxLen: number, field: string): Validator => {
  return (input: string) => {
    if (input && input.length > maxLen) {
      return `${field}'s max length of ${maxLen} characters is reached.`;
    } else {
      return '';
    }
  };
};

export const isValidJSONSchemaCheck = (label?: string): Validator => {
  return (str: string) => {
    try {
      ajv.compile(JSON.parse(str));
      return '';
    } catch (err) {
      return `${capitalize(label)} is invalid for JSON Schema.`;
    }
  };
};
const STRICT_REGEX_SYNTAX = /\\d|\[.*?\]|\\.|\(.*?\)|\^|\$/;
export const isValidRegexString = (patternStr: string): Validator => {
  return (input: string) => {
    try {
      new RegExp(input);
      if (!STRICT_REGEX_SYNTAX.test(input)) {
        return `${capitalize(patternStr)} is invalid for regular expression.`;
      }

      return '';
    } catch (err) {
      console.log('should have failed with err');
      return `${capitalize(patternStr)} is invalid for regular expression.`;
    }
  };
};

export const duplicateNameCheck = (names: string[], service: string): Validator => {
  return (name: string) => {
    return names.includes(name) ? `Duplicate ${service} name ${name}. Must be unique.` : '';
  };
};

export interface ValidationAction {
  // Action to take when a problem is detected
  onFailure(message: string): void;

  // Optional action to take if the input is clean
  onSuccess?(): void;
}

/*
 * Simple error logger
 */
export const errorLogger: ValidationAction = {
  onFailure(message: string): void {
    console.error(message);
  },
};

/*
 * Default action
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
const nonAction: ValidationAction = { onFailure: () => {} };

// eslint-disable-next-line
export const jsonSchemaCheck = (schema: Record<string, unknown>, value: unknown): boolean | PromiseLike<any> => {
  const draft4SchemaId = 'http://json-schema.org/draft-04/schema#';
  if (schema?.$schema === draft4SchemaId) {
    schemaMigration.draft7(schema);
  }
  const validate = ajv.compile(schema);
  return validate(value);
};

const capitalize = (word) => (!word ? word : word[0].toUpperCase() + word.substr(1).toLowerCase());
