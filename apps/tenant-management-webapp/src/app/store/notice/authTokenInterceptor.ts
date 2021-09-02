import { AxiosInstance, AxiosRequestConfig } from 'axios';

export default function addAuthTokenInterceptor(http: AxiosInstance, token: string): void {
  http.interceptors.request.use((req: AxiosRequestConfig) => {
    req.headers['Authorization'] = `Bearer ${token}`;
    return req;
  });
}
