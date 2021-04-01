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

  async getUsers(): Promise<User[]> {
    const res = await this.http.get(`/${this.realm}/users`);
    return res.data;
  }

  async getRoles(): Promise<Role[]> {
    const res = await this.http.get(`/${this.realm}/roles`);
    return res.data;
  }

  async getUsersByRole(roleName: string): Promise<User[]> {
    const res = await this.http.get(`/${this.realm}/roles/${roleName}/users`);
    return res.data;
  }
}
