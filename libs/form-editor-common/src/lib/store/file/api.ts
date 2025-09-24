import axios, { AxiosInstance } from 'axios';
import { ConfigState, FileApi as FileApiConfig } from '../config/models';
import { FileService, FileCriteria } from './models';

export class FileApi {
  private http: AxiosInstance;
  private fileConfig: FileApiConfig;
  private after: string;

  constructor(config: ConfigState, token: string, after?: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }
    this.fileConfig = config.fileApi;
    this.after = after;
    this.http = axios.create({ baseURL: this.fileConfig.host });
    this.http.interceptors.request.use((config) => {
      config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
  }

  async uploadFile(formData: FormData): Promise<FileService> {
    const url = this.fileConfig.endpoints.fileAdmin;
    const res = await this.http.post(url, formData);
    return res.data;
  }

  async fetchFiles(criteria: FileCriteria): Promise<FileService> {
    const url = this.fileConfig.endpoints.fileAdmin;
    let getParam = `${url}?`;

    if (this?.after) {
      getParam = getParam + `after=${this.after || ''}&`;
    }
    if (criteria) {
      getParam = getParam + `criteria=${JSON.stringify(criteria)}`;
    }

    const res = await this.http.get(getParam);
    return res.data;
  }

  async fetchFile(id: string): Promise<FileService> {
    const url = this.fileConfig.endpoints.fileAdmin;
    const res = await this.http.get(`${url}/${id}`);
    return res.data;
  }

  async downloadFiles(id: string): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileAdmin}/${id}/download?unsafe=true`;
    const res = await this.http.get(url, { responseType: 'blob' });
    return res.data;
  }

  async deleteFile(id: string): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileAdmin}/${id}`;
    const res = await this.http.delete(url);
    return res.data;
  }

  async fetchFileTypeHasFile(fileTypeId: string): Promise<boolean> {
    const url = `${this.fileConfig.endpoints.fileAdmin}?top=1&criteria={"typeEquals":"${fileTypeId}"}`;
    const { data } = await this.http.get(url);
    return !!data.page?.size;
  }
}
