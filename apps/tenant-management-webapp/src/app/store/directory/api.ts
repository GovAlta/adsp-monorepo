import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Directory, Service } from './models';
import { TenantApi as TenantApiConfig } from '@store/config/models';
import { toKebabName } from '@lib/kebabName';

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
    const url = `${this.config.host}/api/directory/v2/namespaces/platform`;
    const res = await this.http.get(url);
    return res?.data;
  }

  async fetchDirectoryTenant(tenantName: string): Promise<Directory> {
    const url = `${this.config.host}/api/directory/v2/namespaces/platform`;
    const tenantUrl = url.substr(0, url.lastIndexOf('/') + 1) + toKebabName(tenantName);
    const res = await this.http.get(tenantUrl);
    return res?.data;
  }

  async createEntry(service: Service): Promise<boolean> {
    const url = `${this.config.host}/api/directory/v2/namespaces/platform`;
    const tenantUrl = url.substr(0, url.lastIndexOf('/') + 1) + toKebabName(service.name);
    const payload = {};
    payload['service'] = service.namespace;
    if (service.api) {
      payload['api'] = service.api;
    }
    payload['url'] = service.url;
    const res = await this.http.post(tenantUrl, payload);
    return res?.data === 'Created';
  }
  async updateEntry(service: Service): Promise<boolean> {
    const url = `${this.config.host}/api/directory/v2/namespaces/platform`;
    const tenantUrl = url.substr(0, url.lastIndexOf('/') + 1) + toKebabName(service.name);
    const payload = {};
    payload['service'] = service.namespace;
    if (service.api) {
      payload['api'] = service.api;
    }
    payload['url'] = service.url;
    const res = await this.http.put(tenantUrl, payload);
    return res?.data === 'Created';
  }

  async deleteEntry(service: Service): Promise<boolean> {
    const url = `${this.config.host}/api/directory/v2/namespaces/platform`;
    const tenantUrl =
      url.substr(0, url.lastIndexOf('/') + 1) + toKebabName(service.name) + '/services/' + service.namespace;
    const res = await this.http.delete(tenantUrl);
    return res?.data === 'OK';
  }

  async fetchEntryDetail(service: Service): Promise<boolean> {
    const url = `${this.config.host}/api/directory/v2/namespaces/platform`;
    const tenantUrl =
      url.substr(0, url.lastIndexOf('/') + 1) + toKebabName(service.name) + '/services/' + service.namespace;
    const res = await this.http.get(tenantUrl);
    return res?.data;
  }

  async createDirectory(directory: Directory): Promise<boolean> {
    const url = `${this.config.host}/api/directory/v2/`;
    const res = await this.http.post(url, directory);
    return res?.data;
  }
}
