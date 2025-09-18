import axios, { AxiosInstance } from 'axios';
import addAuthTokenInterceptor from './authTokenInterceptor';
import { EndpointStatusEntry, ApplicationStatus, Webhooks, ApplicationWebhooks } from './models';

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
    const res = await this.http.get(`/applications/${encodeURIComponent(appKey)}/endpoint-status-entries?top=${limit}`);
    return res.data;
  }
  async getAllEndpointStatusEntries(): Promise<EndpointStatusEntry[]> {
    const minutes = 30;
    const res = await this.http.get(`/applications/endpoint-status-entries?ageInMinutes=${minutes}`);
    return res.data;
  }

  async saveApplication(props: ApplicationStatus): Promise<ApplicationStatus> {
    const res = await this.http.post(`/applications`, props);
    return res.data;
  }
  async updateApplication(props: ApplicationStatus): Promise<ApplicationStatus> {
    const res = await this.http.put(`/applications/${encodeURIComponent(props.appKey)}`, props);
    return res.data;
  }

  async deleteApplication(appKey: string): Promise<void> {
    await this.http.delete(`/applications/${encodeURIComponent(appKey)}`);
  }

  async setStatus(applicationId: string, status: string): Promise<ApplicationStatus> {
    const res = await this.http.patch(`/applications/${applicationId}/status`, { status });
    return res.data;
  }

  async toggleApplication(applicationId: string, enabled: boolean): Promise<ApplicationStatus> {
    const res = await this.http.patch(`/applications/${applicationId}/toggle`, { enabled });
    return res.data;
  }

  async testWebhook(webhook: Webhooks, eventName: string): Promise<object> {
    const res = await this.http.get(`/webhook/${webhook.id}/test/${eventName}`);
    return res.data;
  }
}

export class WebhookApi {
  private http: AxiosInstance;
  constructor(baseUrl: string, token: string) {
    this.http = axios.create({ baseURL: `${baseUrl}/configuration/v2/configuration/platform` });
    addAuthTokenInterceptor(this.http, token);
  }

  async saveWebhookPush(props: Record<string, Webhooks>): Promise<object> {
    const body = {
      operation: 'UPDATE',
      update: { webhooks: props },
    };

    const res = await this.http.patch(`/push-service`, body);
    return res.data;
  }
  async saveWebhookStatus(props: ApplicationWebhooks): Promise<object> {
    const body = {
      operation: 'UPDATE',
      update: props,
    };

    const res = await this.http.patch(`/status-service`, body);
    return res.data;
  }
  async fetchWebhookPush(): Promise<object> {
    const res = await this.http.get(`/push-service`);

    return res.data;
  }
  async fetchWebhookStatus(): Promise<object> {
    const res = await this.http.get(`/status-service`);

    return res.data;
  }

  async deleteWebhook(id: string): Promise<object> {
    const res = await this.http.patch(`/push-service`, {
      operation: 'DELETE',
      property: `webhooks[${id}]`,
    });

    return res.data;
  }
}
