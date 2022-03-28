import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3333' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:event-service' }),
    CLIENT_SECRET: envalid.str(),
    REDIS_HOST: envalid.str({ default: 'verify-redis' }),
    REDIS_PORT: envalid.num({ default: 6379 }),
    REDIS_PASSWORD: envalid.str({ default: '' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    PORT: envalid.num({ default: 3340 }),
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
