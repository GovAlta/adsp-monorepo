import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ConfigState, NotificationApi as NotificationApiConfig } from '@store/config/models';
import { NotificationService } from './models';

export class NotificationApi {
  private http: AxiosInstance;
  private notificationConfig: NotificationApiConfig;
  constructor(config: ConfigState, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }
    this.notificationConfig = config.notificationApi;
    this.http = axios.create({ baseURL: this.notificationConfig.host });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
    });
  }

  async uploadNotification(formData: FormData): Promise<NotificationService> {
    const url = this.notificationConfig.endpoints.notificationAdmin;
    const res = await this.http.post(url, formData);
    return res.data;
  }

  async fetchNotifications(): Promise<NotificationService> {
    const url = this.notificationConfig.endpoints.notificationAdmin;
    const res = await this.http.get(url);
    return res.data;
  }

  async downloadNotifications(id: string): Promise<NotificationService> {
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['responseType'] = ['blob'];
      return req;
    });

    const url = `${this.notificationConfig.endpoints.notificationAdmin}/${id}/download`;
    const res = await this.http.get(url);
    return res.data;
  }

  async deleteNotification(id: string): Promise<NotificationService> {
    const url = `${this.notificationConfig.endpoints.notificationAdmin}/${id}`;
    const res = await this.http.delete(url);
    return res.data;
  }

  async fetchNotificationTypeHasNotification(notificationTypeId: string): Promise<boolean> {
    const url = `${this.notificationConfig.endpoints.notificationAdmin}?top=1&criteria={"typeEquals":"${notificationTypeId}"}`;
    const { data } = await this.http.get(url);
    return !!data.page?.size;
  }
}
