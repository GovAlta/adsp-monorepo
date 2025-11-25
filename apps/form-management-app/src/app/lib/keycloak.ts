import axios from 'axios';

export interface Role {
  id: string;
  name: string;
}

export interface Tenant {
  id: string;
  name: string;
  realm: string;
  adminEmail: string;
  isTenantAdmin: boolean;
  isTenantCreated: boolean;
  realmRoles: Role[];
  loginSucceeded?: boolean;
}
interface TenantsResponse {
  results: Tenant[];
}

/*
 *  Tenant name => Realm name
 *  Note: Kebab case tenant names have their dashes replaced
 *        by spaces, giving users the convenience of typing
 *        a dash instead of %20 when logging in to tenants
 *        with a space in their name.
 */
export const getRealm = async (name: string, host: string): Promise<string | null> => {
  if (!host) {
    return null;
  }
  const actualName = name.replace(/-/g, '%20');
  const request = axios.create({ baseURL: host });
  const url = `/api/tenant/v2/tenants?name=${actualName}`;
  const { data } = await request.get<TenantsResponse>(url);
  if (data?.results?.length !== 1) {
    return null;
  }
  return data.results[0].realm;
};
