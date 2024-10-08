import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3331' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:form-gateway' }),
    CLIENT_SECRET: envalid.str(),
    SESSION_SECRET: envalid.str({ default: 'jumping juniper' }),
    REDIS_HOST: envalid.str({ default: 'form-gateway-redis' }),
    REDIS_PORT: envalid.num({ default: 6379 }),
    REDIS_PASSWORD: envalid.str({ default: '' }),
    RECAPTCHA_SECRET: envalid.str({ default: '' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    PORT: envalid.num({ default: 3346 }),
    ADDRESS_TOKEN_CLIENT_ID: envalid.str({ default: '' }),
    ADDRESS_TOKEN_URL: envalid.str({
      default: '',
    }),
    ADDRESS_TOKEN_CLIENT_SECRET: envalid.str({ default: '' }),
    ADDRESS_URL: envalid.str({ default: '' }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
