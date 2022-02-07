import { AccessState } from './models';

/**
 * Types
 */

const FETCH_ACCESS_ACTION = 'tenant/access/FETCH_ACCESS';
const FETCH_ACCESS_SUCCESS_ACTION = 'tenant/access/FETCH_ACCESS_SUCCESS';
const ACCESS_RESET_ACTION = 'tenant/access/RESET';

export { FETCH_ACCESS_ACTION };

export interface FetchAccessAction {
  type: typeof FETCH_ACCESS_ACTION;
}

export interface FetchAccessSuccessAction {
  type: typeof FETCH_ACCESS_SUCCESS_ACTION;
  payload: AccessState;
}

export interface AccessResetAction {
  type: typeof ACCESS_RESET_ACTION;
}

export type ActionTypes = FetchAccessAction | FetchAccessSuccessAction | AccessResetAction;

/**
 * Functions
 */
export const fetchAccess = (): FetchAccessAction => ({
  type: 'tenant/access/FETCH_ACCESS',
});

export const fetchAccessSuccess = (payload: AccessState): FetchAccessSuccessAction => ({
  type: 'tenant/access/FETCH_ACCESS_SUCCESS',
  payload,
});

export const accessReset = (): AccessResetAction => ({
  type: 'tenant/access/RESET'
});
