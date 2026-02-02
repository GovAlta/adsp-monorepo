import * as dotenv from 'dotenv';
dotenv.config();

export const environment = {
  production: false,
  port: '3333',
  TENANT_REALM: null,
  ACCESS_SERVICE_URL: null,
  DIRECTORY_SERVICE_URL: null,
  CLIENT_ID: 'urn:ads:demo:chat-service',
  CLIENT_SECRET: null,
  TRUSTED_PROXY: 'uniquelocal',
  LOG_LEVEL: 'debug',
  ...process.env,
};
