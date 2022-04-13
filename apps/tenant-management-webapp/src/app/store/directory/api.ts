import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { Directory, Service, MetadataFetchResponse } from './models';
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

  async fetchDirectoryTenant(tenantName: string): Promise<Directory> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${toKebabName(tenantName)}`;
    const res = await this.http.get(url);
    return res?.data;
  }

  async createEntry(service: Service): Promise<Service> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${service.namespace}`;
    const res = await this.http.post(url, { ...service });
    return res?.data;
  }

  async updateEntry(service: Service): Promise<boolean> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${service.namespace}`;
    const res = await this.http.put(url, { ...service });
    return res?.data === 'Created';
  }

  async deleteEntry(service: Service): Promise<boolean> {
    const delService = service?.api ? `${service.service}:${service.api}` : service.service;
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${service.namespace}/services/${delService}`;
    const res = await this.http.delete(url);
    return res?.data === 'OK';
  }

  async fetchEntryDetail(service: Service): Promise<MetadataFetchResponse> {
    const url = `${this.config.host}${this.config.endpoints.directory}/namespaces/${service.namespace}/services/${service.service}`;
    const res = await this.http.get(url, { timeout: 2000 });
    return res?.data;
  }
}
