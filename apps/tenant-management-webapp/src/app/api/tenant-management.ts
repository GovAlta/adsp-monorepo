import axios, { AxiosInstance } from 'axios';

let http: AxiosInstance;

interface Config {
  baseUrl: string;
}

export function init(config: Config) {
  http = axios.create({ baseURL: config.baseUrl });
}

export { http };
