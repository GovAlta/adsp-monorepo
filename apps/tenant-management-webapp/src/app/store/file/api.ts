import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ConfigState, TenantApi as TenantApiConfig } from '@store/config/models';
import { FileService } from './models';

export class FileApi {
  private http: AxiosInstance;
  private tenantConfig: TenantApiConfig;
  private fileApi: string;
  constructor(config: ConfigState, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }
    this.tenantConfig = config.tenantApi;
    this.fileApi = config.serviceUrls.fileApi;
    this.http = axios.create({ baseURL: this.tenantConfig.host });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
    });
  }

  async fetchSpace(tenantId: string, realm: string): Promise<FileService> {
    const url = `${this.tenantConfig.host}${this.tenantConfig.endpoints.spaceAdmin}`;
    const res = await this.http.post(url, { tenantId, realm });
    return res.data;
  }

  async uploadFile(formData: FormData, endpoint: string): Promise<FileService> {
    const url = `${this.fileApi}${endpoint}`;
    const res = await this.http.post(url, formData);
    return res.data;
  }

  async fetchFiles(endpoint: string): Promise<FileService> {
    const url = `${this.fileApi}${endpoint}`;
    const res = await this.http.get(url);
    return res.data;
  }

  async downloadFiles(endpoint: string, token: string): Promise<FileService> {
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Accept'] = '*/*';
      req.headers['responseType'] = ['blob'];
      return req;
    });
    const url = `${this.fileApi}${endpoint}`;
    const res = await this.http.get(url);
    return res.data;
  }

  async deleteFile(endpoint: string): Promise<FileService> {
    const url = `${this.fileApi}${endpoint}`;
    const res = await this.http.delete(url);
    return res.data;
  }
}
