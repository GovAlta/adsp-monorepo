import axios, { AxiosInstance } from 'axios';
import { ServiceStatusApplication } from './models';

export class ServiceTokenApi {
  private http: AxiosInstance;
  public baseUrl: string;
  public clientSecret: string;
  public token: string;
  constructor(baseUrl: string, clientSecret: string,) {
    this.baseUrl = baseUrl;
    this.http = axios;
    this.clientSecret = clientSecret
  }

  async setToken(token) {
    this.token = token
  }

  async getToken(): Promise<ServiceStatusApplication[]> {
    const data = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id:'status-service-account',
      client_secret: this.clientSecret,
    })

    console.log(data  +"<data")
    const res = await this.http.post(`${this.baseUrl}/auth/realms/core/protocol/openid-connect/token`, data, {
      headers: {
        'Content-type': 'application/x-www-form-urlencoded',
      },
    })

    return res.data;
  }

  async subscribe(tenant: string, email: string): Promise<ServiceStatusApplication[]> {
    console.log(JSON.stringify(this.token) + "<this.token");
    console.log(JSON.stringify(tenant) + "<tenant");
    const res = await this.http.post(`${this.baseUrl}/subscription/v1/subscribers`, { tenant: tenant, email: email },{
      headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
    }).catch(function (error) {
      throw new Error(error?.response?.data?.error);
    });

    return res.data;
  }
}
//http://localhost:3335/subscription/v1/types/status-application-health-change/subscriptions?userSub=true
