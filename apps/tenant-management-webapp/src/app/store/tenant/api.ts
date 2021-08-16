import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Tenant, Role } from './models';
import { TenantApi as TenantApiConfig } from '@store/config/models';

export class TenantApi {
  private http: AxiosInstance;
  private config: TenantApiConfig;
  constructor(config: TenantApiConfig, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }

    this.http = axios.create({ baseURL: config.host });
    this.config = config;
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
    });
  }

  async fetchTenantByRealm(realm: string): Promise<Tenant> {
    const url = `${this.config.host}${this.config.endpoints.tenantNameByRealm}/${realm}`;
    const res = await this.http.get(url);
    return res?.data?.tenant;
  }

  async fetchTenantByName(name: string): Promise<Tenant> {
    const url = `${this.config.host}${this.config.endpoints.tenantByName}/${name}`;
    const res = await this.http.get(url);
    return res.data;
  }

  async createTenant(name: string): Promise<Tenant> {
    const url = `${this.config.host}${this.config.endpoints.createTenant}`;
    const res = await this.http.post(url, {
      name: name,
    });
    return res.data;
  }

  async fetchTenantByEmail(email: string): Promise<Tenant> {
    const url = `${this.config.host}${this.config.endpoints.tenantByEmail}`;
    const res = await this.http.post(url, { email });
    return res.data;
  }

  async hasAdminRole(): Promise<Tenant> {
    const url = `${this.config.host}/api/tenant/v1/hasadminrole`;
    const res = await this.http.post(url);
    return res.data;
  }

  async fetchRealmRoles(): Promise<Role[]> {
    const url = `${this.config.host}/api/tenant/v1/realm/roles`;
    const res = await this.http.get(url);
    return res.data.roles;
  }
}
