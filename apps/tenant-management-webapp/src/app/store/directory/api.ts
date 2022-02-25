import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Directory } from './models';
import { TenantApi as TenantApiConfig } from '@store/config/models';

const toKebabName = (tenantName: string): string => {
  return tenantName.toLowerCase().replace(/ /g, '-');
};

export class DirectoryApi {
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

  async fetchDirectory(): Promise<Directory> {
    const url = `${this.config.host}${this.config.endpoints.directory}`;
    const res = await this.http.get(url);
    return res?.data;
  }

  async fetchDirectoryTenant(tenantName: string): Promise<Directory> {
    const url = `${this.config.host}${this.config.endpoints.directory}`;
    const tenantUrl = url.substr(0, url.lastIndexOf('/') + 1) + toKebabName(tenantName);
    const res = await this.http.get(tenantUrl);
    return res?.data;
  }
}
