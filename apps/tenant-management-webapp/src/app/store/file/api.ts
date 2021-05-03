import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ConfigState, FileApi as FileApiConfig } from '@store/config/models';
import { FileService } from './models';

export class FileApi {
  private http: AxiosInstance;
  private fileConfig: FileApiConfig;
  constructor(config: ConfigState, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }
    this.fileConfig = config.fileApi;
    this.http = axios.create({ baseURL: this.fileConfig.host });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
    });
  }

  async uploadFile(formData: FormData): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileAdmin}`;
    const res = await this.http.post(url, formData);
    return res.data;
  }

  async fetchFiles(): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileAdmin}`;
    const res = await this.http.get(url);
    return res.data;
  }

  async downloadFiles(id: string, token: string): Promise<FileService> {
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['responseType'] = ['blob'];
      return req;
    });

    const url = `${this.fileConfig.endpoints.fileAdmin}/${id}/download`;
    const res = await this.http.get(url);
    return res.data;
  }

  async deleteFile(id: string): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileAdmin}/${id}`;
    const res = await this.http.delete(url);
    return res.data;
  }

  async enableFileService(): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.spaceAdmin}`;
    const res = await this.http.post(url);
    return res.data;
  }

  async fetchFileType(): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileTypeAdmin}`;
    const res = await this.http.get(url);
    return res.data;
  }

  async deleteFileType(id: string): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileTypeAdmin}/${id}`;
    const res = await this.http.delete(url);
    return res.data;
  }

  async createFileType(fileInfo): Promise<FileService> {
    const readRolesArray = fileInfo.readRoles ? fileInfo.readRoles.split(',') : [];
    const updateRolesArray = fileInfo.updateRoles ? fileInfo.updateRoles.split(',') : [];

    const data = {
      name: fileInfo.name,
      anonymousRead: true,
      readRoles: readRolesArray,
      updateRoles: updateRolesArray,
    };

    const url = `${this.fileConfig.endpoints.fileTypeAdmin}`;
    const res = await this.http.post(url, data);
    return res.data;
  }

  async updateFileType(fileInfo): Promise<FileService> {
    const data = {
      name: fileInfo.name,
      anonymousRead: fileInfo.anonymousRead,
      readRoles: fileInfo.readRoles,
      updateRoles: fileInfo.updateRoles,
    };

    const url = `${this.fileConfig.endpoints.fileTypeAdmin}/${fileInfo.id}`;
    const res = await this.http.put(url, data);
    return res.data;
  }
}
