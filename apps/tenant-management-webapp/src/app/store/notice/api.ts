import axios, { AxiosInstance } from 'axios';
import addAuthTokenInterceptor from './authTokenInterceptor';
import { Notice, Notices } from './models';

export class NoticeApi {
  private http: AxiosInstance;
  constructor(baseUrl: string, token: string) {
    this.http = axios.create({ baseURL: `${baseUrl}/notices/v1` });
    addAuthTokenInterceptor(this.http, token);
  }

  async getNotices(): Promise<Notices[]> {
    const res = await this.http.get(`/`);
    return res.data;
  }

  async deleteNotice(noticeId: string): Promise<Notices[]> {
    const res = await this.http.delete(`/${noticeId}`);
    return res.data;
  }

  async saveNotice(props: Notice): Promise<Notice> {
    if (props.id) {
      const res = await this.http.patch(`/${props.id}`, props);
      return res.data;
    } else {
      const res = await this.http.post(`/`, props);
      return res.data;
    }
  }
}
