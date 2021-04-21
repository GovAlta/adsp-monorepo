import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { TenantApi as TenantApiConfig } from '@store/config/models';
import { FileService } from './models';

export class FileApi {
  private http: AxiosInstance;
  private config: TenantApiConfig;
  constructor(config: TenantApiConfig, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }

    this.config = config;

    this.http = axios.create({ baseURL: config.host });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
    });
  }

  async fetchSpace(tenantId: string, realm: string): Promise<FileService> {
    const url = `${this.config.host}${this.config.endpoints.spaceAdmin}`;
    const res = await this.http.post(url, { tenantId, realm });
    return res.data;
  }

  async uploadFile(formData: FormData, endpoint: string): Promise<FileService> {
    const url = `${this.config.host}${endpoint}`;
    const res = await this.http.post(url, formData);
    return res.data;
  }
}
