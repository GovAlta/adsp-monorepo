import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { ConfigState, FileApi as FileApiConfig } from '@store/config/models';
import { FileService, FileServiceDocs, FileTypeItem } from './models';

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
    const url = this.fileConfig.endpoints.fileAdmin;
    const res = await this.http.post(url, formData);
    return res.data;
  }

  async fetchFiles(): Promise<FileService> {
    const url = this.fileConfig.endpoints.fileAdmin;
    const res = await this.http.get(url);
    return res.data;
  }

  async downloadFiles(id: string): Promise<FileService> {
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
    const url = this.fileConfig.endpoints.spaceAdmin;
    const res = await this.http.post(url);
    return res.data;
  }

  async fetchFileType(): Promise<FileService> {
    const url = this.fileConfig.endpoints.fileTypeAdmin;
    const res = await this.http.get(url);
    return res.data;
  }

  async fetchSpace(): Promise<FileService> {
    const url = this.fileConfig.endpoints.spaceAdmin;
    const res = await this.http.get(url);
    return res.data;
  }

  async deleteFileType(id: string): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileTypeAdmin}/${id}`;
    const res = await this.http.delete(url);
    return res.data;
  }

  async createFileType(fileType: FileTypeItem): Promise<FileService> {
    const url = this.fileConfig.endpoints.fileTypeAdmin;
    const res = await this.http.post(url, fileType);
    return res.data;
  }

  async updateFileType(fileType: FileTypeItem): Promise<FileService> {
    const url = `${this.fileConfig.endpoints.fileTypeAdmin}/${fileType.id}`;
    const res = await this.http.put(url, fileType);
    return res.data;
  }

  async fetchFileTypeHasFile(fileTypeId: string): Promise<boolean> {
    const url = `${this.fileConfig.endpoints.fileAdmin}/fileType/${fileTypeId}`;
    const res = await this.http.get(url);
    return res.data.exist;
  }

  swaggerDocToFileDocs(swaggerDocs) {
    const fileTypeDocs = [];
    const fileDocs = [];
    const fileTypeTag = 'File Type';
    const fileTag = 'File';
    let fileDescription = '';
    let fileTypeDescription = '';
    // Extract the fileType and file Docs from swagger
    for (const [path, content] of Object.entries(swaggerDocs.paths)) {
      // Not all object within the swagger paths are paths. Only the ones include '/' are paths
      if (path.includes('/')) {
        for (const [method, detail] of Object.entries(content)) {
          if (detail.tags.includes(fileTypeTag)) {
            fileTypeDocs.push({
              method: method,
              path: path,
              ...detail,
            });
          }

          if (detail.tags.includes(fileTag)) {
            fileDocs.push({
              method: method,
              path: path,
              ...detail,
            });
          }
        }
      }
    }

    for (const tag of swaggerDocs.tags) {
      if (tag.name === fileTag) {
        fileDescription = tag.description;
      }

      if (tag.name === fileTypeTag) {
        fileTypeDescription = tag.description;
      }
    }

    return {
      fileTypeDoc: {
        apiDocs: fileTypeDocs,
        description: fileTypeDescription,
      },
      fileDoc: {
        apiDocs: fileDocs,
        description: fileDescription,
      },
    };
  }

  async fetchFileServiceDoc(): Promise<FileServiceDocs> {
    const url = `/swagger/json/v1`;
    const res = await this.http.get(url);
    const docs = this.swaggerDocToFileDocs(res.data);
    return docs;
  }
}
