import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { TenantConfig } from './models';
import { TenantApi as TenantApiConfig } from '@store/config/models';

export class TenantConfigApi {
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

  async fetchTenantConfig(): Promise<TenantConfig> {
    const url = this.config.endpoints.tenantConfig;
    const res = await this.http.get(url);
    return res.data;
  }

  async createTenantConfig(data: Record<string, unknown>): Promise<TenantConfig> {
    const url = this.config.endpoints.tenantConfig;
    const res = await this.http.post(url, data);
    return res.data;
  }

  async updateTenantConfig(data: Record<string, unknown>): Promise<TenantConfig> {
    const url = this.config.endpoints.tenantConfig;
    const res = await this.http.put(url, data);
    return res.data;
  }
}
