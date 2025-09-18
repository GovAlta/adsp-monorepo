import axios, { AxiosInstance } from 'axios';
import { Tenant } from './models';
import { TenantApi as TenantApiConfig } from '@store/config/models';

interface TenantsResponse {
  results: Tenant[];
}

interface UserIdResponse {
  userIdInCore: string;
}

interface CheckIdPInCoreResponse {
  hasDefaultIdpInCore: string;
}

export class TenantApi {
  private http: AxiosInstance;
  constructor(config: TenantApiConfig, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }

    this.http = axios.create({ baseURL: config.host });
    this.http.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${token}`;
      config.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return config;
    });
  }

  async createTenant(name: string): Promise<Tenant> {
    const url = '/api/tenant/v2/tenants';
    const res = await this.http
      .post(url, {
        name: name,
      })
      .catch(function (error) {
        throw new Error(error?.response?.data.errorMessage);
      });
    return res.data;
  }

  async fetchTenantByRealm(realm: string): Promise<Tenant> {
    const url = '/api/tenant/v2/tenants';
    const { data } = await this.http.get<TenantsResponse>(url, { params: { realm } });
    return data.results[0];
  }

  async fetchTenantByEmail(adminEmail: string): Promise<Tenant> {
    const url = '/api/tenant/v2/tenants';
    const { data } = await this.http.get<TenantsResponse>(url, { params: { adminEmail } });
    return data.results[0];
  }
}

export const callFetchUserIdInCoreByEmail = async (url: string, token: string, email: string): Promise<string> => {
  const { data } = await axios.get<UserIdResponse>(url, {
    headers: { Authorization: `Bearer ${token}` },
    params: { email },
  });
  return data?.userIdInCore;
};

export const callCheckUserIdpInCore = async (url: string, token: string, userId: string): Promise<string> => {
  const { data } = await axios.get<CheckIdPInCoreResponse>(url, {
    headers: { Authorization: `Bearer ${token}` },
    params: { userId },
  });
  return data?.hasDefaultIdpInCore;
};

export const callFetchUserIdInTenantByEmail = async (url: string, token: string, email: string): Promise<string> => {
  const { data } = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
    params: { email },
  });
  return data?.[0]?.id;
};

export const callDeleteUserIdPFromCore = async (
  url: string,
  token: string,
  userId: string,
  realm: string
): Promise<void> => {
  try {
    await axios.delete(url, {
      headers: { Authorization: `Bearer ${token}` },
      params: { userId, realm },
    });
  } catch (err) {
    if (err?.response?.status === 400) {
      if (err?.response?.data?.errorMessage?.includes('due to Request failed with status code 404')) {
        throw new Error(`Cannot find the goa-ad IdP in the ${realm} for the user.`);
      }
    }

    throw new Error(`Error deleting user IdP: ${err?.response?.data?.errorMessage || err?.message}`);
  }
};
