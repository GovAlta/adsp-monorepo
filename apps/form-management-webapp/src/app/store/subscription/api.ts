import axios, { AxiosInstance } from 'axios';
import { Subscriber } from './models';

export class Api {
  private http: AxiosInstance;
  public baseUrl: string;
  public token: string;
  constructor(baseUrl: string, token: string) {
    this.baseUrl = baseUrl;
    this.http = axios;
    this.token = token;
  }

  async update(subscriber: Subscriber): Promise<Subscriber> {
    const res = await this.http
      .patch(`${this.baseUrl}/subscription/v1/subscribers/${subscriber.id}`, subscriber, {
        headers: { Authorization: `Bearer ${this.token}`, 'Content-Type': 'application/json' },
      })
      .catch(function (error) {
        throw new Error(error?.response?.data?.errorMessage);
      });
    return res.data;
  }
}
