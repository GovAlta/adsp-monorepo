import axios, { AxiosInstance } from 'axios';
import { ServiceStatusApplication } from './models';

export class ApplicationApi {
  private http: AxiosInstance;
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.http = axios.create({ baseURL: baseUrl });
  }

  async getApplications(name: string): Promise<ServiceStatusApplication[]> {
    const res = await this.http.get(`/public_status/v1/applications/${name}`);
    return res.data;
  }

  async getNotices(): Promise<ServiceStatusApplication[]> {
    const res = await this.http.get(`/notice/v1/notices`);
    return res.data?.results;
  }
}
