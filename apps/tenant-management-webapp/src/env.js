import getConfig from './app/utils/useConfig';

const localEnvs = {
  notificationServiceUrl: 'https://some.url.com/',
  keycloakUrl: 'http://localhost:8080/',
  tenantManagementApi: 'http://localhost:3333/',
  accessManagementApi: 'http://localhost:8080/',
  uiComponentUrl: 'http://localhost:4400/'
}

const env = () => {
  if (process.env.NODE_ENV !== 'development'){
    const [envs,,] = getConfig();
    return envs
  } else {
    return localEnvs;
  }
}

export default env;
