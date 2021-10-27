import axios, { AxiosInstance } from 'axios';
import addAuthTokenInterceptor from './authTokenInterceptor';
import { EndpointStatusEntry, ServiceStatusApplication } from './models';

export class StatusApi {
  private http: AxiosInstance;
  constructor(baseUrl: string, token: string) {
    this.http = axios.create({ baseURL: `${baseUrl}/status/v1` });
    addAuthTokenInterceptor(this.http, token);
  }

  async getApplications(): Promise<ServiceStatusApplication[]> {
    const res = await this.http.get(`/applications`);
    return res.data;
  }

  async getEndpointStatusEntries(applicationId: string): Promise<EndpointStatusEntry[]> {
    // We show up to 30 right now.
    const limit = 35;
    const res = await this.http.get(`/applications/${applicationId}/endpoint-status-entries?top=${limit}`);
    return res.data;
  }

  async saveApplication(props: ServiceStatusApplication): Promise<ServiceStatusApplication> {
    if (props._id) {
      const res = await this.http.put(`/applications/${props._id}`, props);
      return res.data;
    } else {
      const res = await this.http.post(`/applications`, props);
      return res.data;
    }
  }

  async deleteApplication(applicationId: string): Promise<void> {
    await this.http.delete(`/applications/${applicationId}`);
  }

  async setStatus(applicationId: string, status: string): Promise<ServiceStatusApplication> {
    const res = await this.http.patch(`/applications/${applicationId}/status`, { status });
    return res.data;
  }

  async toggleApplication(applicationId: string, enabled: boolean): Promise<ServiceStatusApplication> {
    const res = await this.http.patch(`/applications/${applicationId}/toggle`, { enabled });
    return res.data;
  }
}
