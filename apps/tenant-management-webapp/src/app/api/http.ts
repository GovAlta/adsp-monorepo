import axios from 'axios';

const http = axios.create();
http.defaults.headers.common['Accept'] = 'application/json';

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

export const setAuthToken = (token) => {
  http.defaults.headers.common['Authorization'] = 'bearer ' + token;
};

export const executePostWithAccessToken = (endpoint, params) => {
  return http.post(endpoint, {
    ...params,
  });
};
export const executeGetWithAccessToken = (endpoint) => {
  return http.get(endpoint);
};

export const executePostAnonymous = (endpoint, params) => {
  return http.post(
    endpoint,
    {
      ...params,
    },
    {
      headers: {
        Authorization: null,
      },
    }
  );
};

export const executeGetAnonymous = (endpoint) => {
  return http.post(endpoint, {
    headers: {
      Authorization: null,
    },
  });
};

http.interceptors.response.use(
  (response) => {
    if (response.status === 200) {
      return response.data;
    }
    return response;
  },
  (error) => {
    if (error.response) {
      if (error.response.status === 401) {
        setAuthToken(null);
      } else if (error.response.status === 304) {
        return error.response;
      }
    }
    error.httpError = true;
    return Promise.reject(error);
  }
);

export default http;
