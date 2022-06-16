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

export interface ValidInput {
  pattern: RegExp;
  onFailureMessage: string;
}

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
    pattern: new RegExp(/^[a-zA-Z0-9-]+$/),
    onFailureMessage: 'Allowed characters are: a-z, A-Z, 0-9, -',
  },
  mixedArrowCaseWithSpace: {
    pattern: new RegExp(/^[a-zA-Z0-9- ]+$/),
    onFailureMessage: 'Allowed characters are: a-z, A-Z, 0-9, -, [space]',
  },
  lowerKebabCase: { pattern: new RegExp(/^[a-z0-9-]+$/), onFailureMessage: 'Allowed characters are: a-z, 0-9, -' },
  upperKebabCase: { pattern: new RegExp(/^[A-Z0-9-]+$/), onFailureMessage: 'Allowed characters are: A-Z, 0-9, -' },
  validURL: { pattern: new RegExp(/^(http|https):\/\/[^ "]+$/), onFailureMessage: 'Please enter a valid URL' },
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

export const isValidJSONCheck = (label?: string): Validator => {
  return (str: string) => {
    try {
      JSON.parse(str);
      return '';
    } catch (err) {
      return 'Invalid JSON string';
    }
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
