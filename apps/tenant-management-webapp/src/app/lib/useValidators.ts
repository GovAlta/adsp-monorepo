import { ValidationAction } from './checkInput';

import { useState } from 'react';
import { checkInput, Validator } from './checkInput';

/**
 * A React Hook for creating a set of validation methods that will
 * check the input on a UI component, such as a modal pop-up, with a
 * set of input fields.  The hook is implemented via the builder pattern
 * and can be used as follows:
 * const {errors, validators} = useValidators(<validator name>, <field>, ... validators)
 *    .add(<another validator name>, <another field>, ...validators)
 *    .etc
 *    .build()
 *
 * validation can then be done via:
 *     validators[<validator name>].check(<input>)
 *
 * errors can be tested via:
 *     errors?.[<field>]
 *
 * @param name
 * Name the validator being added to the collection
 * @param field
 * Name of the field (e.g. text input box) to which the errors will be attached
 * @param validators
 * List of validators that apply to the field
 * @returns
 * A collection of validators to be used to check for valid input on the specified field
 */
export const useValidators = (name: string, field: string, ...validators: Validator[]): ValidatorServiceBuilder => {
  const [error, setError] = useState<ValidatorErrors>({});
  const inputChecker = reactInputCheckerFactory(error, setError);
  const set = new ValidatorCollectionImpl(inputChecker, error);
  return set.add(name, field, ...validators);
};

export type ValidatorService = {
  errors: ValidatorErrors;
  validators: ValidatorCollection;
};

export interface ValidatorCollection {
  haveErrors: () => boolean;
  clear: () => void;
  update: () => void;
  add(name: string, field: string, ...validators: Validator[]): ValidatorServiceBuilder;
}

export type ValidatorErrors = Record<string, string>;

type ValidatorServiceBuilder = {
  service: ValidatorService;
  add: (name: string, field: string, ...validators: Validator[]) => ValidatorServiceBuilder;
  build: () => ValidatorService;
};

interface reactInputChecker {
  handleErrors: (field: string) => ValidationAction;
  clear: () => void;
  error: (name: string) => string;
  hasErrors: () => boolean;
  update: () => void;
}

const reactInputCheckerFactory = (
  errors: ValidatorErrors,
  setErrors: React.Dispatch<React.SetStateAction<ValidatorErrors>>
): reactInputChecker => {
  return {
    handleErrors: (field: string) => {
      return {
        onFailure(message: string): void {
          errors[field] = message;
        },
        onSuccess(): void {
          delete errors[field];
        },
      };
    },
    clear: () => {
      setErrors({});
    },
    error: (name: string) => {
      return errors[name] || '';
    },
    update: () => {
      setErrors({ ...errors });
    },
    hasErrors: (): boolean => {
      return Object.keys(errors).length > 0;
    },
  };
};

class ValidatorCollectionImpl implements ValidatorCollection {
  private errorHandler: reactInputChecker;
  private errors: ValidatorErrors;

  constructor(errorHandler: reactInputChecker, errors: ValidatorErrors) {
    this.errorHandler = errorHandler;
    this.errors = errors;
  }

  haveErrors(): boolean {
    return this.errorHandler.hasErrors();
  }

  clear(): void {
    this.errorHandler.clear();
  }

  update(): void {
    this.errorHandler.update();
  }

  add(name: string, field: string, ...validators: Validator[]): ValidatorServiceBuilder {
    // The validators are implicit, named, fields in a ValidatorCollection object
    this[name] = {
      check: (input: string): string => {
        return checkInput(input, validators, this.errorHandler.handleErrors(field));
      },
    };
    return {
      service: { errors: this.errors, validators: this },
      add: (name: string, field: string, ...validators: Validator[]): ValidatorServiceBuilder => {
        return this.add(name, field, ...validators);
      },
      build: () => {
        return { errors: this.errors, validators: this };
      },
    };
  }
}
