import { Dispatch } from 'react';
export const CUSTOM_ERROR_ADD_ACTION = 'jsonforms/custom/errors/add';
export const CUSTOM_ERROR_DELETE_ACTION = 'jsonforms/custom/errors/delete';
export const CUSTOM_ERROR_RESET_ACTION = 'jsonforms/custom/errors/reset';

export interface CustomErrorIdentifier {
  path: string;
  type?: string;
}

export interface CustomError extends CustomErrorIdentifier {
  error: string;
}
type AddActionType = { type: string; error: CustomError };
type DeleteActionType = { type: string; errorIdentifier: CustomErrorIdentifier };
export type ErrorActions = AddActionType | DeleteActionType | { type: string };

export type CustomerErrorDispatch = Dispatch<ErrorActions>;
export type Errors = CustomError[];

export function customErrorReducer(errors: Errors, action: ErrorActions): Errors {
  switch (action.type) {
    case CUSTOM_ERROR_ADD_ACTION: {
      const { error } = action as unknown as AddActionType;
      errors.push(error);
      return [...errors];
    }

    case CUSTOM_ERROR_DELETE_ACTION: {
      const { errorIdentifier } = action as unknown as DeleteActionType;
      return [...errors.filter((e) => e.path! !== errorIdentifier.path && e.type !== errorIdentifier.type)];
    }

    case CUSTOM_ERROR_RESET_ACTION: {
      return [];
    }
  }

  return errors;
}
