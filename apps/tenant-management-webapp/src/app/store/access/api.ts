import axios, { AxiosInstance } from 'axios';
import { User, Role, KeycloakGroup } from './models';

interface GroupRepresentation {
  id: string;
  name: string;
  path: string;
  subGroupCount?: number;
  subGroups?: GroupRepresentation[];
}

const GROUP_PAGE_SIZE = 500;

export class KeycloakApi {
  private http: AxiosInstance;
  constructor(
    baseUrl: string,
    private realm: string,
    private token: string
  ) {
    this.http = axios.create({ baseURL: `${baseUrl}/admin/realms` });
    this.http.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${this.token}`;
      return config;
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

  // Lists every group of the realm, subgroups included, sorted by path.
  async getGroups(): Promise<KeycloakGroup[]> {
    const groups: KeycloakGroup[] = [];
    await this.collectGroups(`/${this.realm}/groups`, groups);
    return groups.sort((a, b) => a.path.localeCompare(b.path));
  }

  private async collectGroups(url: string, groups: KeycloakGroup[]): Promise<void> {
    const { data } = await this.http.get<GroupRepresentation[]>(url, {
      params: { briefRepresentation: true, first: 0, max: GROUP_PAGE_SIZE },
    });
    await this.addGroups(data, groups);
  }

  // Older Keycloak versions return subgroups inline; newer ones only return a count, and the
  // subgroups are read from the children endpoint.
  private async addGroups(representations: GroupRepresentation[], groups: KeycloakGroup[]): Promise<void> {
    for (const { id, name, path, subGroups, subGroupCount } of representations) {
      groups.push({ id, name, path });
      if (subGroups?.length) {
        await this.addGroups(subGroups, groups);
      } else if (subGroupCount > 0) {
        await this.collectGroups(`/${this.realm}/groups/${id}/children`, groups);
      }
    }
  }
}
