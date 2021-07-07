import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access-dev.os99.gov.ab.ca' }),
    DIRECTORY_URL: envalid.str({ default: 'https://tenant-management-api-core-services-dev.os99.gov.ab.ca' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:notification-service' }),
    CLIENT_SECRET: envalid.str(),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'notification' }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    AMQP_HOST: envalid.str({ default: 'localhost' }),
    AMQP_USER: envalid.str({ default: 'guest' }),
    AMQP_PASSWORD: envalid.str({ default: 'guest' }),
    SMTP_HOST: envalid.str({ default: 'smtp.mailtrap.io' }),
    SMTP_PORT: envalid.num({ default: 587 }),
    SMTP_USER: envalid.str({ default: null }),
    SMTP_PASSWORD: envalid.str({ default: null }),
    NOTIFY_URL: envalid.str({ default: null }),
    NOTIFY_API_KEY: envalid.str({ default: null }),
    NOTIFY_TEMPLATE_ID: envalid.str({ default: null }),
    PORT: envalid.num({ default: 3335 }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
