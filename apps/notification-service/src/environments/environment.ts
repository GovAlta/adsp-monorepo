import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'https://access.adsp-dev.gov.ab.ca' }),
    DIRECTORY_URL: envalid.str({ default: 'https://directory-service.adsp-dev.gov.ab.ca' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:notification-service' }),
    CLIENT_SECRET: envalid.str(),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    MONGO_URI: envalid.str({ default: 'mongodb://localhost:27017' }),
    MONGO_DB: envalid.str({ default: 'notification' }),
    MONGO_USER: envalid.str({ default: '' }),
    MONGO_PASSWORD: envalid.str({ default: '' }),
    MONGO_TLS: envalid.bool({ default: false }),
    AMQP_HOST: envalid.str({ default: 'localhost' }),
    AMQP_USER: envalid.str({ default: 'guest' }),
    AMQP_PASSWORD: envalid.str({ default: 'guest' }),
    SMTP_HOST: envalid.str({ default: 'smtp.mailtrap.io' }),
    SMTP_PORT: envalid.num({ default: 587 }),
    SMTP_USER: envalid.str({ default: '' }),
    SMTP_PASSWORD: envalid.str({ default: '' }),
    FROM_ADDRESS: envalid.str({ default: 'noreply@gov.ab.ca' }),
    NOTIFY_URL: envalid.str({ default: '' }),
    NOTIFY_API_KEY: envalid.str({ default: '' }),
    NOTIFY_TEMPLATE_ID: envalid.str({ default: '' }),
    BOT_TENANT_ID: envalid.str({ default: '' }),
    BOT_APP_TYPE: envalid.str({ default: 'SingleTenant' }),
    BOT_APP_ID: envalid.str({ default: '' }),
    BOT_APP_SECRET: envalid.str({ default: '' }),
    PORT: envalid.num({ default: 3335 }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalidated env vars: ${util.inspect(errors)}`);
      }
    },
  }
);
