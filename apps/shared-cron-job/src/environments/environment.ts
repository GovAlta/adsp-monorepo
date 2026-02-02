import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();
export const POD_TYPES = {
  api: 'api',
  job: 'job',
};

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access.adsp-dev.gov.ab.ca' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:shared-cron-job' }),
    CLIENT_SECRET: envalid.str({ default: '' }),
    DIRECTORY_URL: envalid.str({ default: 'https://directory-service.adsp-dev.gov.ab.ca' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  },
);

environment.isProd; // true if NODE_ENV === 'production'
