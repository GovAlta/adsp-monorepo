/**
 * CheckInput
 *
 * Used to check for clean input.  It works on a list of cleansers, each one
 * performing a different check.  There are character and word cleansers.
 *
 *
 * Usage:
 *  const error = checkInput(input, [cleanser])
 *
 * Optional Parameters:
 *   1. A reporter, for sophisticated error handling. See the ReactCleansingReporter
 *      as an example.
 *      checkInput(input, [cleanser], reporter)
 *
 *   2. The name of the field being cleansed. This is passed through to
 *      the reporter, which may make use of it.   See the ReactCleansingReporter
 *      as an example.
 *      checkInput(input, [cleanser], reporter, 'field-name')
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
export const checkInput = (
  input: unknown,
  cleansers: Cleanser[],
  reporter?: CleansingReporter,
  field?: string
): string => {
  if (reporter === undefined) {
    reporter = new NonReporter();
  }
  for (let i = 0; i < cleansers.length; i++) {
    const message = cleansers[i](input);
    if (message) {
      reporter.add(message, field);
      return message;
    }
    reporter.clearErrors(field);
  }
  return '';
};

/* Some common character cleansing patterns for your convenience */
export const cleansingPatterns = {
  alphanumericAC: { pattern: new RegExp(/^[a-zA-Z0-9-]+$/), message: 'Allowed characters are: a-z, A-Z, 0-9, -' },
  alphanumericLC: { pattern: new RegExp(/^[a-z0-9-]+$/), message: 'Allowed characters are: a-z, 0-9, -' },
  urlCharacters: { pattern: new RegExp(/^(http|https):\/\/[^ "]+$/), message: 'Please enter a valid URL' },
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

export const wordCleanser = (forbidden: string[], label?: string): Cleanser => {
  return (input: string) => {
    const message = label === undefined ? `Cannot use the word ${input} as ${label}` : `${input} is forbidden`;
    return forbidden.some((e) => e === input) ? message : '';
  };
};

export const isNotEmptyCheck = (label: string): Cleanser => {
  return (input: string) => {
    return input.length > 0 ? '' : `${label} is required`;
  };
};

export interface CleansingReporter {
  add(message: string, label?: string): void;
  clearErrors(label?: string): void;
}

/*
 * The default reporter; used when the value returned by check input is all that's needed.
 */
class NonReporter implements CleansingReporter {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  add(error: string): void {}

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearErrors(): void {}
}

/*
 * Use when all you need is a console log of the error
 */
export class CleansingLogger implements CleansingReporter {
  add(message: string): void {
    console.log(`Message: ${message}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  clearErrors(): void {}
}

/*
 * Use when the error is stuffed into a React state
 */
export class ReactCleansingReporter implements CleansingReporter {
  messages: Record<string, string>;
  setMessages: React.Dispatch<React.SetStateAction<Record<string, string>>>;

  constructor(
    existingErrors: Record<string, string>,
    setErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>
  ) {
    this.messages = existingErrors;
    this.setMessages = setErrors;
  }

  add(message: string, field: string): void {
    const err = { ...this.messages };
    err[field] = message;
    this.setMessages(err);
  }

  clearErrors(field: string): void {
    delete this.messages[field];
    this.setMessages({ ...this.messages });
  }
}
