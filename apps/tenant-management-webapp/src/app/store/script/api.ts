import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface Response {
  message: string;
}

export class ScriptApi {
  private http: AxiosInstance;
  //private scriptUrl: string;
  constructor(scriptUrl: string, token: string) {
    if (!token) {
      throw new Error('missing auth token = tenant api');
    }

    this.http = axios.create({ baseURL: scriptUrl });
    this.http.interceptors.request.use((req: AxiosRequestConfig) => {
      req.headers['Authorization'] = `Bearer ${token}`;
      req.headers['Content-Type'] = 'application/json;charset=UTF-8';
      return req;
    });
    //this.scriptUrl = scriptUrl;
  }

  async runScript(id: string): Promise<Response> {
    const url = `/script/v1/scripts/${id}`;
    const res = await this.http.post(url, {}).catch(function (error) {
      console.log(JSON.stringify(error) + '<error');
      console.log(JSON.stringify(error?.response) + '<error?.response?');
      console.log(JSON.stringify(error?.response?.data) + '<error?.response?.data');

      console.log(JSON.stringify(error?.response?.data) + '<error?.response?.data.errorMessage');
      throw new Error(error?.response?.data);
    });
    return res.data;
  }
}
