/**
 * CheckInput
 *
 * Used to check for clean input.  It works on a list of cleansers, each one
 * performing a different check.  There are character and word cleansers defined
 * here, but there can be others.
 *
 *
 * Usage:
 *  const error = checkInput(input, [cleanser])
 *
 * Optional Parameters:
 *   1. An action, for sophisticated error handling. See the ReactErrorHandler
 *      as an example.
 *      checkInput(input, [cleanser], errorHandler)
 *
 * There are some canned cleansers that can be used:
 *   1. The character cleanser: checks that the input matches a regular expression.
 *      Some common CleansingPatterns are in the cleansingPatterns object below.
 *
 *   2. The word cleanser: checks that the input does not match anything on a list
 *      of forbidden words.
 *
 */

export interface CleansingPattern {
  pattern: RegExp;
  message: string;
}

/**
 * Given a list of cleansers and name of the input field, report on its cleanliness
 */
export const checkInput = (input: unknown, cleansers: Cleanser[], action?: CleansingAction): string => {
  if (action === undefined) {
    action = nonAction;
  }
  for (let i = 0; i < cleansers.length; i++) {
    const message = cleansers[i](input);
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
export const cleansingPattern = {
  mixedArrowCase: { pattern: new RegExp(/^[a-zA-Z0-9-]+$/), message: 'Allowed characters are: a-z, A-Z, 0-9, -' },
  lowerArrowCase: { pattern: new RegExp(/^[a-z0-9-]+$/), message: 'Allowed characters are: a-z, 0-9, -' },
  upperArrowCase: { pattern: new RegExp(/^[A-Z0-9-]+$/), message: 'Allowed characters are: A-Z, 0-9, -' },
  validURL: { pattern: new RegExp(/^(http|https):\/\/[^ "]+$/), message: 'Please enter a valid URL' },
};

export type Cleanser = (input) => string;

/* Some common cleansers */
export const characterCleanser = (cleansingPattern: CleansingPattern): Cleanser => {
  return (input: string) => {
    if (input) {
      return !cleansingPattern.pattern.test(input) ? cleansingPattern.message : '';
    }
    return '';
  };
};

export const wordCleanser = (forbidden: string[]): Cleanser => {
  return (input: string) => {
    return forbidden.some((e) => e === input) ? `${input} is forbidden` : '';
  };
};

export const isNotEmptyCheck = (label: string): Cleanser => {
  return (input: string) => {
    return input.length > 0 ? '' : `${label} is required`;
  };
};

export interface CleansingAction {
  // Action to take when a problem is detected
  onFailure(message: string): void;

  // Optional action to take if the input is clean
  onSuccess?(): void;
}

/*
 * The default: no action taken
 */
// eslint-disable-next-line @typescript-eslint/no-empty-function
const nonAction: CleansingAction = { onFailure: () => {} };

/*
 * Simple error logger
 */
export const errorLogger: CleansingAction = {
  onFailure(message: string): void {
    console.log(`Error: ${message}`);
  },
};

/*
 * Use when the error is stuffed into a React state
 */
export class ReactErrorHandler implements CleansingAction {
  messages: Record<string, string>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  field: string;

  constructor(
    existingErrors: Record<string, string>,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>,
    field: string
  ) {
    this.messages = existingErrors;
    this.setMessages = setErrors;
    this.field = field;
  }

  onFailure(message: string): void {
    const err = { ...this.messages };
    err[this.field] = message;
    this.setMessages(err);
  }

  onSuccess(): void {
    delete this.messages[this.field];
    this.setMessages({ ...this.messages });
  }
}
