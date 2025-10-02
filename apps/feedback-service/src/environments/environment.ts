import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    // KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    // DIRECTORY_URL: envalid.str({ default: 'http://localhost:3331' }),
    // CLIENT_ID: envalid.str({ default: 'urn:ads:platform:feedback-service' }),
    // CLIENT_SECRET: envalid.str(),
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access.adsp-dev.gov.ab.ca/auth' }),
    DIRECTORY_URL: envalid.str({ default: 'https://directory-service.adsp-dev.gov.ab.ca' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:feedback-service' }),
    CLIENT_SECRET: envalid.str({ default: 'rFluZV3rLzpltwkfWh4CfNxkfgyojTyn' }),
    AMQP_HOST: envalid.str({ default: 'localhost' }),
    AMQP_USER: envalid.str({ default: 'guest' }),
    AMQP_PASSWORD: envalid.str({ default: 'guest' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    PORT: envalid.num({ default: 3342 }),
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
