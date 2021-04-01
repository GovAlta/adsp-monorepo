import axios from 'axios';
import * as Logging from './logging';
const logger = Logging.createLogger('[CORE COMMON][HTTP]', 'info');

export const HOSTS = {
  tenantAPI: process.env.TENANT_MANAGEMENT_API_HOST || 'http://localhost:3333',
};

/**
 * adminHttp is created for backend tenant admin level communication.
 * The token for adminHttp is - realm: core; client: tenant-api
 * For example, please use adminHttp generic config or user information.
 * */
const adminHttp = axios.create();
adminHttp.defaults.headers.common['Accept'] = 'application/json';

export const setAdminAuthToken = () => {
  adminHttp.defaults.headers.common['Authorization'] = `Bearer ${process.env.KEYCLOAK_TENANT_API_AUTH_TOKEN}`;
};

adminHttp.interceptors.request.use(
  (config) => {
    if (config.method === 'post' && typeof config.data === 'string') {
      config.data = JSON.stringify(config.data);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

adminHttp.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data;
    }
    return response;
  },
  (error) => {
    logger.error(error);
    error.httpError = true;
    return Promise.reject(error);
  }
);

export const executeAdminPost = (endpoint, params): any => {
  return adminHttp.post(endpoint, {
    ...params,
  });
};

export const executeAdminGet = (endpoint, params = {}): any => {
  return adminHttp.get(endpoint, params);
};
