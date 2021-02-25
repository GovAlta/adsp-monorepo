import axios from 'axios';

const http = axios.create();

http.interceptors.request.use(
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

http.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default http;
