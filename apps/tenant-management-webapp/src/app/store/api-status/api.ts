import { TenantApi as TenantApiConfig } from '@store/config/models';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export default class StatusApi {
  http: AxiosInstance;
  constructor(config: TenantApiConfig, token: string) {
    this.http = axios.create({ baseURL: config.host });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      req.headers['Authorization'] = `Bearer ${token}`;
      return req;
    });
  }

  async fetchStatus(): Promise<string> {
    const res = await this.http.get('/health');
    return res.data['uptime'];
  }
}
