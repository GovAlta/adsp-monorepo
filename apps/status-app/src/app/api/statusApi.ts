import axios, { AxiosInstance } from 'axios';
import { ServiceStatusApplication } from './models';

export class StatusApi {
  private http: AxiosInstance;
  public name: string;
  public baseUrl: string;
  constructor(baseUrl: string, name: string) {
    this.name = name;
    this.baseUrl = baseUrl;
    this.http = axios;
  }

  async getPublicApplications(): Promise<ServiceStatusApplication[]> {
    const res = await this.http.get(`${this.baseUrl}/public_status/v1/applications/${this.name}`);
    return res.data;
  }
}
