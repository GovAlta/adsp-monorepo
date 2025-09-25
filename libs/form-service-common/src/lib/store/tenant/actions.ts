import { Tenant, Role } from './models';
export const FETCH_REALM_ROLES = 'FETCH_REALM_ROLES';
export const FETCH_REALM_ROLES_SUCCESS = 'FETCH_REALM_ROLES_SUCCESS';

interface FetchRealmRolesAction {
  type: typeof FETCH_REALM_ROLES;
}

interface FetchRealmRolesSuccessAction {
  type: typeof FETCH_REALM_ROLES_SUCCESS;
  payload: Role[];
}

export type ActionType =
  | FetchRealmRolesAction
  | FetchRealmRolesSuccessAction

export const FetchRealmRoles = (): FetchRealmRolesAction => ({
  type: FETCH_REALM_ROLES,
});

export const FetchRealmRolesSuccess = (roles: Role[]): FetchRealmRolesSuccessAction => ({
  type: FETCH_REALM_ROLES_SUCCESS,
  payload: roles,
});
