import axios from 'axios';

export interface Tenant {
  id: string;
  name: string;
}

export async function getTenants(tenantApiUrl: URL, accessToken: string): Promise<Tenant[]> {
  const {
    data: { results },
  } = await axios.get<{ results: Tenant[] }>(new URL('v2/tenants', tenantApiUrl).href, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return results;
}
