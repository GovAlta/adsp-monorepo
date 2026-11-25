import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    PORT: envalid.port({ default: 3350 }),
    TRUSTED_PROXY: envalid.str({ default: '' }),
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3331' }),
    // One ID shared with the rotation job, so events and configuration have a single owner.
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:client-secret-rotation-service' }),
    CLIENT_SECRET: envalid.str(),
    // Dedicated confidential client in the master realm, the same one the job uses (spec section 8).
    KEYCLOAK_ROTATION_CLIENT_ID: envalid.str({ default: 'client-secret-rotation-job' }),
    KEYCLOAK_ROTATION_CLIENT_SECRET: envalid.str(),
    OTEL_EXPORTER_OTLP_ENDPOINT: envalid.str({ default: '' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  },
);
