import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

const MIN_SECRET_LENGTH = 16;

// Secrets protect stored sessions and client credentials, so an empty or trivial value is not acceptable.
const secret = envalid.makeValidator<string>((input) => {
  if (input.length < MIN_SECRET_LENGTH) {
    throw new Error(`must be at least ${MIN_SECRET_LENGTH} characters`);
  }
  return input;
});

/**
 * Fail fast on invalid configuration; the service must not run with missing or weak secrets.
 * Only the names and reasons are reported; values are never logged.
 */
const failOnInvalid = (errors: Record<string, Error>) => {
  const reasons = Object.entries(errors).map(
    ([name, err]) => `${name}: ${err instanceof envalid.EnvMissingError ? 'is required' : err.message}`
  );
  console.error(`Invalid env vars: ${util.inspect(reasons)}`);
  process.exit(1);
};

export const createEnvironment = (
  env: NodeJS.ProcessEnv,
  onInvalid: (errors: Record<string, Error>) => void = failOnInvalid
) => {
  // Secrets have no defaults, so each deployment and local environment must provide its own.
  // Tests use fixed values so that they do not depend on the environment.
  const testSecret = (name: string) => (env.NODE_ENV === 'test' ? { default: `${name}-for-testing-only` } : {});

  return envalid.cleanEnv(
    env,
    {
      KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
      DIRECTORY_URL: envalid.str({ default: 'http://localhost:3331' }),
      CLIENT_ID: envalid.str({ default: 'urn:ads:platform:token-handler' }),
      CLIENT_SECRET: envalid.str(testSecret('CLIENT_SECRET')),
      STORE_SECRET: secret(testSecret('STORE_SECRET')),
      SESSION_SECRET: secret(testSecret('SESSION_SECRET')),
      SECRET_SALT: secret(testSecret('SECRET_SALT')),
      REDIS_HOST: envalid.str({ default: 'token-handler-redis' }),
      REDIS_PORT: envalid.num({ default: 6379 }),
      REDIS_PASSWORD: envalid.str({ default: '' }),
      LOG_LEVEL: envalid.str({ default: 'debug' }),
      PORT: envalid.num({ default: 3600 }),
      TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
    },
    {
      reporter: ({ errors }) => {
        if (Object.keys(errors).length !== 0) {
          onInvalid(errors as unknown as Record<string, Error>);
        }
      },
    }
  );
};

export const environment = createEnvironment(process.env);
