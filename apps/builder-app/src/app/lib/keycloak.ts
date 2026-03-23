import axios from 'axios';

interface Tenant {
  realm: string;
}

interface TenantsResponse {
  results: Tenant[];
}

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
