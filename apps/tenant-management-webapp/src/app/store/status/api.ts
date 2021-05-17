import axios, { AxiosInstance } from 'axios';
import addAuthTokenInterceptor from './authTokenInterceptor';
import { ServiceStatusApplication } from './models';

export class StatusApi {
  private http: AxiosInstance;
  constructor(baseUrl: string, token: string) {
    this.http = axios.create({ baseURL: `${baseUrl}/status/v1` });
    addAuthTokenInterceptor(this.http, token);
  }

  async toggleApplication(applicationId: string, enabled: boolean): Promise<ServiceStatusApplication> {
    const res = await this.http.patch(`/applications/${applicationId}/${enabled ? 'enable' : 'disable'}`);
    return res.data;
  }

  async getApplications(): Promise<ServiceStatusApplication[]> {
    const res = await this.http.get(`/applications`);
    return res.data;
  }

  async saveApplication(props: ServiceStatusApplication): Promise<ServiceStatusApplication> {
    if (props.id) {
      const res = await this.http.put(`/applications/${props.id}`, props);
      return res.data;
    } else {
      const res = await this.http.post(`/applications`, props);
      return res.data;
    }
  }

  async deleteApplication(applicationId: string): Promise<void> {
    await this.http.delete(`/applications/${applicationId}`);
  }
}
