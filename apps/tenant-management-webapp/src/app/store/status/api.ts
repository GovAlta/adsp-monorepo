import axios, { AxiosInstance } from 'axios';
import addAuthTokenInterceptor from './authTokenInterceptor';
import { EndpointStatusEntry, ApplicationStatus } from './models';

export class StatusApi {
  private http: AxiosInstance;
  constructor(baseUrl: string, token: string) {
    this.http = axios.create({ baseURL: `${baseUrl}/status/v1` });
    addAuthTokenInterceptor(this.http, token);
  }

  async getApplications(): Promise<ApplicationStatus[]> {
    const res = await this.http.get(`/applications`);
    return res.data;
  }

  async getEndpointStatusEntries(appKey: string): Promise<EndpointStatusEntry[]> {
    // We show up to 30 right now.
    const limit = 35;
    const res = await this.http.get(`/applications/${appKey}/endpoint-status-entries?top=${limit}`);
    return res.data;
  }

  async saveApplication(props: ApplicationStatus): Promise<ApplicationStatus> {
    const res = await this.http.post(`/applications`, props);
    return res.data;
  }
  async updateApplication(props: ApplicationStatus): Promise<ApplicationStatus> {
    const res = await this.http.put(`/applications/${props.appKey}`, props);
    return res.data;
  }

  async deleteApplication(appKey: string): Promise<void> {
    await this.http.delete(`/applications/${appKey}`);
  }

  async setStatus(applicationId: string, status: string): Promise<ApplicationStatus> {
    const res = await this.http.patch(`/applications/${applicationId}/status`, { status });
    return res.data;
  }

  async toggleApplication(applicationId: string, enabled: boolean): Promise<ApplicationStatus> {
    const res = await this.http.patch(`/applications/${applicationId}/toggle`, { enabled });
    return res.data;
  }
}
