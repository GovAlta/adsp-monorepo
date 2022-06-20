import { ValidationAction } from './checkInput';

import { useState } from 'react';
import { checkInput, Validator } from './checkInput';
import { ThemeProvider } from 'styled-components';

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
  const set = new ValidatorCollectionImpl(error, setError);
  return set.add(name, field, ...validators);
};

export type ValidatorService = {
  errors: ValidatorErrors;
  validators: ValidatorCollection;
};

export interface ValidatorCollection {
  haveErrors: () => boolean;
  clear: () => void;
  add(name: string, field: string, ...validators: Validator[]): ValidatorServiceBuilder;
  checkAll: (inputs: ValidationInputs) => void;
}

export type ValidatorErrors = Record<string, string>;
export type ValidationInputs = Record<string, string>;

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
}

const reactInputCheckerFactory = (
  errors: ValidatorErrors,
  setErrors: React.Dispatch<React.SetStateAction<ValidatorErrors>>
): reactInputChecker => {
  return {
    handleErrors: (field: string) => {
      return {
        onFailure(message: string): void {
          const err = { ...errors };
          err[field] = message;
          setErrors(err);
        },
        onSuccess(): void {
          delete errors[field];
          setErrors({ ...errors });
        },
      };
    },
    clear: () => {
      setErrors({});
    },
    error: (name: string) => {
      return errors[name] || '';
    },
    hasErrors: (): boolean => {
      return Object.keys(errors).length > 0;
    },
  };
};

class ValidatorCollectionImpl implements ValidatorCollection {
  private errorHandler: reactInputChecker;
  private errors: ValidatorErrors;
  private setErrors: React.Dispatch<React.SetStateAction<ValidatorErrors>>;

  constructor(errors: ValidatorErrors, setErrors: React.Dispatch<React.SetStateAction<ValidatorErrors>>) {
    this.errors = errors;
    this.setErrors = setErrors;
    this.errorHandler = reactInputCheckerFactory(errors, setErrors);
  }

  haveErrors(): boolean {
    return this.errorHandler.hasErrors();
  }

  clear(): void {
    this.errorHandler.clear();
  }

  checkAll(inputs: ValidationInputs) {
    const entries = Object.entries(inputs);
    const errCopy = { ...this.errors };
    entries.forEach(([name, input]) => {
      if ((this[name]?.field && input, this[name].validators)) {
        const err = checkInput(input, this[name].validators);
        if (err) {
          errCopy[this[name].field] = err;
        }
      } else {
        console.warn(`Cannot find validators for ${name}.`);
      }
    });
    this.setErrors(errCopy);
  }

  add(name: string, field: string, ...validators: Validator[]): ValidatorServiceBuilder {
    // The validators are implicit, named, fields in a ValidatorCollection object
    this[name] = {
      check: (input: string): string => {
        return checkInput(input, validators, this.errorHandler.handleErrors(field));
      },
      field,
      validators,
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
