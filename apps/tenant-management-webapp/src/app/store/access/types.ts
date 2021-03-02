import { TenantAPI } from "../reducers/config.contract";
import { User as CurrentUser } from "../reducers/user.contract";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  enabled: boolean;
  emailVerified: boolean;
  email: string;
  requiredActions: string[];
  access: {
    [key: string]: boolean;
  };
}

export interface Role {
  id: string;
  clientRole: boolean;
  description: string;
  name: string;
  userIds: string[];
}

export interface AccessState {
  users: User[];
  roles: Role[];
}

export const GET_ACCESS_ACTION = 'tenant/access/GET_ACCESS';
interface GetAccessAction {
  type: typeof GET_ACCESS_ACTION;
}

export const FETCH_ACCESSINFO_ACTION = 'tenant/access/FETCH_ACCESSINFO';

export interface FetchAccessAction {
  type: typeof FETCH_ACCESSINFO_ACTION;
  payload: {
    user: CurrentUser,
    tenant: TenantAPI,
  };
}
export const FETCH_ACCESSINFO_SUCCESS_ACTION = 'tenant/access/FETCH_ACCESSINFO_SUCCESS';
interface FetchAccessInfoSuccessAction {
  type: typeof FETCH_ACCESSINFO_SUCCESS_ACTION;
  payload: {
    users: User[],
    roles: Role[]
  }
}
export type ActionTypes =
  | GetAccessAction
  | FetchAccessAction
  | FetchAccessInfoSuccessAction
