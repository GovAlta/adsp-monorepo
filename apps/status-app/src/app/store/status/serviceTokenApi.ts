import axios, { AxiosInstance } from 'axios';
import { ServiceStatusApplication } from './models';

export class ServiceTokenApi {
  private http: AxiosInstance;
  public baseUrl: string;
  public clientSecret: string;
  public token: string;
  constructor(baseUrl: string, clientSecret: string) {
    this.baseUrl = baseUrl;
    this.http = axios;
    this.clientSecret = clientSecret;
  }

  async setToken(token: string): Promise<void> {
    this.token = token;
  }

  async getToken(): Promise<ServiceStatusApplication[]> {
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: 'status-service-account',
      client_secret: this.clientSecret,
    });

    const res = await this.http.post(`${this.baseUrl}/auth/realms/core/protocol/openid-connect/token`, data, {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
    });

    return res.data;
  }

  async subscribe(tenant: string, email: string, type: string): Promise<ServiceStatusApplication[]> {
    const res = await this.http
      .post(
        `${this.baseUrl}/subscription/v1/subscribers`,
        { tenant: tenant, email: email },
        {
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        }
      )
      .catch(function (error) {
        if (JSON.parse(error?.response?.data?.error).id) {
          return { data: { id: JSON.parse(error?.response?.data?.error).id } };
        } else {
          throw new Error(error?.response?.data?.error);
        }
      });

    const res2 = await this.http
      .post(
        `${this.baseUrl}/subscription/v1/types/${type}/subscriptions/${res.data?.id}`,
        { tenant: tenant },
        {
          headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
        }
      )
      .catch(function (error) {
        throw new Error(error?.response?.data?.error);
      });

    return res2.data;
  }
}
