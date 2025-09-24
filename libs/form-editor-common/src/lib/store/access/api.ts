import axios, { AxiosInstance } from 'axios';
import { Role } from './models';

export class KeycloakApi {
  private http: AxiosInstance;
  constructor(baseUrl: string, private realm: string, private token: string) {
    this.http = axios.create({ baseURL: `${baseUrl}/admin/realms` });
    this.http.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${this.token}`;
      return config;
    });
  }

  async getRoles(): Promise<Role[]> {
    const { data } = await this.http.get(`/${this.realm}/roles`);
    return data;
  }
}
