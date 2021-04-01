import { AccessState } from './models';

/**
 * Types
 */

const GET_ACCESS_ACTION = 'tenant/access/GET_ACCESS';
export const FETCH_ACCESS_ACTION = 'tenant/access/FETCH_ACCESS';
const FETCH_ACCESS_SUCCESS_ACTION = 'tenant/access/FETCH_ACCESS_SUCCESS';

interface GetAccessAction {
  type: typeof GET_ACCESS_ACTION;
}

export interface FetchAccessAction {
  type: typeof FETCH_ACCESS_ACTION;
}

export interface FetchAccessSuccessAction {
  type: typeof FETCH_ACCESS_SUCCESS_ACTION;
  payload: AccessState;
}

export type ActionTypes = GetAccessAction | FetchAccessAction | FetchAccessSuccessAction;

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
