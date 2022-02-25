import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { User, Role } from './models';

export class KeycloakApi {
  private http: AxiosInstance;
  constructor(baseUrl: string, private realm: string, private token: string) {
    this.http = axios.create({ baseURL: `${baseUrl}/admin/realms` });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${this.token}`;
      return req;
    });
  }

  async getUserCount(enabled?: boolean): Promise<User[]> {
    const params: Record<string, unknown> = {};
    if (enabled) {
      params.enabled = true;
    }
    const { data } = await this.http.get(`/${this.realm}/users/count`, { params });
    return data;
  }

  async getUser(id: string): Promise<User> {
    const { data } = await this.http.get(`/${this.realm}/users/${id}`);
    return data;
  }

  async getRoles(): Promise<Role[]> {
    const { data } = await this.http.get(`/${this.realm}/roles`);
    return data;
  }

  async getUsersByRole(roleName: string): Promise<User[]> {
    const { data } = await this.http.get(`/${this.realm}/roles/${roleName}/users`);
    return data;
  }
}
