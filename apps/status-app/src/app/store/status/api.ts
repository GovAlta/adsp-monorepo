import axios, { AxiosInstance } from 'axios';
import { ServiceStatusApplication, Subscriber } from './models';

export class ApplicationApi {
  private http: AxiosInstance;

  constructor(baseUrl: string) {
    this.http = axios.create({ baseURL: baseUrl });
  }

  async getApplications(name: string): Promise<ServiceStatusApplication[]> {
    const res = await this.http.get(`/public_status/v1/applications/${name}`);
    return res.data;
  }

  async getNotices(name: string): Promise<ServiceStatusApplication[]> {
    const res = await this.http.get(`/notice/v1/notices`, { params: { name: name } });
    return res.data?.results;
  }
}

export class SubscriberApi {
  private http: AxiosInstance;

  constructor(baseUrl: string) {
    this.http = axios.create({ baseURL: baseUrl });
  }

  async subscribe(tenant: string, email: string): Promise<Subscriber> {
    const { data } = await this.http.post<{ subscriber: Subscriber }>('application-status', {
      tenant: tenant,
      email: email,
    });
    return data.subscriber;
  }
}
