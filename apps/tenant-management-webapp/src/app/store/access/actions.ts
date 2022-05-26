import { Role, ServiceRoleState } from './models';

/**
 * Types
 */

const FETCH_ACCESS_ACTION = 'tenant/access/FETCH_ACCESS';
const FETCH_ACCESS_SUCCESS_ACTION = 'tenant/access/FETCH_ACCESS_SUCCESS';
const ACCESS_RESET_ACTION = 'tenant/access/RESET';
const FETCH_SERVICE_ROLES = 'tenant/service/roles';
const FETCH_SERVICE_ROLES_SUCCESS = 'tenant/service/roles/success';

export { FETCH_ACCESS_ACTION, FETCH_SERVICE_ROLES };

export interface FetchAccessAction {
  type: typeof FETCH_ACCESS_ACTION;
}

export interface FetchAccessSuccessAction {
  type: typeof FETCH_ACCESS_SUCCESS_ACTION;
  payload: {
    userCount: number;
    activeUserCount: number;
    roles: Role[];
  };
}

export interface AccessResetAction {
  type: typeof ACCESS_RESET_ACTION;
}

export interface FetchServiceRolesAction {
  type: typeof FETCH_SERVICE_ROLES;
}

export interface FetchServiceRolesSuccessAction {
  type: typeof FETCH_SERVICE_ROLES_SUCCESS;
  payload: ServiceRoleState;
}

export type ActionTypes =
  | FetchAccessAction
  | FetchAccessSuccessAction
  | AccessResetAction
  | FetchServiceRolesAction
  | FetchServiceRolesSuccessAction;

/**
 * Functions
 */
export const fetchAccess = (): FetchAccessAction => ({
  type: 'tenant/access/FETCH_ACCESS',
});

export const fetchAccessSuccess = (
  userCount: number,
  activeUserCount: number,
  roles: Role[]
): FetchAccessSuccessAction => ({
  type: 'tenant/access/FETCH_ACCESS_SUCCESS',
  payload: {
    userCount,
    activeUserCount,
    roles,
  },
});

export const accessReset = (): AccessResetAction => ({
  type: 'tenant/access/RESET',
});

export const fetchServiceRoles = (): FetchServiceRolesAction => ({
  type: FETCH_SERVICE_ROLES,
});

export const fetchServiceRolesSuccess = ({ tenant, core }: ServiceRoleState): FetchServiceRolesSuccessAction => ({
  type: FETCH_SERVICE_ROLES_SUCCESS,
  payload: {
    tenant,
    core,
  },
});
