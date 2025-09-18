import { AxiosInstance } from 'axios';

export default function addAuthTokenInterceptor(http: AxiosInstance, token: string): void {
  http.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
}
