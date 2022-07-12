import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Tenant, Role } from './models';
import { TenantApi as TenantApiConfig } from '@store/config/models';

interface TenantsResponse {
  results: Tenant[];
}

export class TenantApi {
  private http: AxiosInstance;
  constructor(config: TenantApiConfig, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }

    this.http = axios.create({ baseURL: config.host });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
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

  async fetchRealmRoles(): Promise<Role[]> {
    const url = '/api/tenant/v1/realm/roles';
    const res = await this.http.get(url);
    return res.data.roles;
  }
}
