import { ErrorObject } from 'ajv';
import { Dispatch } from 'react';

export const CUSTOM_ERROR_ADD_ACTION = 'jsonforms/custom/errors/add';
export const CUSTOM_ERROR_DELETE_ACTION = 'jsonforms/custom/errors/delete';
export const CUSTOM_ERROR_DELETE_RESET_ACTION = 'jsonforms/custom/errors/reset';

export type ErrorActions =
  | { type: string; error: ErrorObject }
  | { type: string; payload: { path: string } }
  | { type: string };

export type CustomerErrorDispatch = Dispatch<ErrorActions>;
export type Errors = ErrorObject[];
export function customErrorReducer(errors: Errors, action: ErrorActions): Errors {
  switch (action.type) {
    case CUSTOM_ERROR_ADD_ACTION: {
      return errors;
    }

    case CUSTOM_ERROR_DELETE_ACTION: {
      return errors;
    }

    case CUSTOM_ERROR_DELETE_RESET_ACTION: {
      return errors;
    }
  }

  return errors;
}
