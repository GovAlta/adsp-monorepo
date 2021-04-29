import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ServiceStatus } from './models';

export class HealthApi {
  private http: AxiosInstance;
  constructor(baseUrl: string, token: string) {
    this.http = axios.create({ baseURL: `${baseUrl}/health/v1` });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      return req;
    });
  }

  async getHealth(tenantName: string): Promise<ServiceStatus> {
    const res = await this.http.get(`/tenants/${tenantName}`);
    return res.data;
  }
}
