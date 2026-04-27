import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

export const environment = envalid.cleanEnv(
  process.env,
  {
    KEYCLOAK_ROOT_URL: envalid.str({ default: 'http://localhost:8080' }),
    DIRECTORY_URL: envalid.str({ default: 'http://localhost:3331' }),
    CLIENT_ID: envalid.str({ default: 'urn:ads:platform:agent-service' }),
    CLIENT_SECRET: envalid.str(),
    MODEL: envalid.str({ default: 'github-models/openai/gpt-4.1' }),
    MODEL_URL: envalid.str(),
    MODEL_API_KEY: envalid.str(),
    DB_HOST: envalid.str({ default: '' }),
    DB_PORT: envalid.num({ default: 5432 }),
    DB_NAME: envalid.str({ default: 'postgres' }),
    DB_USER: envalid.str({ default: 'postgres' }),
    DB_PASSWORD: envalid.str({ default: 'guest' }),
    DB_TLS: envalid.bool({ default: false }),
    AGENT_WORKSPACE_PROVIDER: envalid.str({ default: 'agentfs' }),
    AGENT_WORKSPACE_ROOT: envalid.str({ default: '.agent-workspaces' }),
    AGENT_THREAD_TTL_MINUTES: envalid.num({ default: 30 }),
    AGENT_TOKEN_EXPIRY_THRESHOLD_MS: envalid.num({ default: 30000 }),
    AGENT_LAST_MESSAGES: envalid.num({ default: 20 }),
    AGENT_OBSERVATIONAL_MEMORY: envalid.bool({ default: true }),
    AGENT_THREAD_CLEANUP_CRON: envalid.str({ default: '0 * * * *' }),
    AGENT_THREAD_CLEANUP_BATCH_SIZE: envalid.num({ default: 100 }),
    AGENT_JSON_BODY_LIMIT: envalid.str({ default: '50mb' }),
    AGENT_SOCKET_MAX_BUFFER_SIZE: envalid.num({ default: 50 * 1024 * 1024 }),
    AGENT_MAX_FILE_SIZE_BYTES: envalid.num({ default: 50 * 1024 * 1024 }),
    AGENT_MAX_TARBALL_SIZE_BYTES: envalid.num({ default: 500 * 1024 * 1024 }),
    AGENT_MCP_SERVER_CREDENTIALS_FILE: envalid.str({ default: '/var/run/secrets/adsp/mcp/mcp-servers.json' }),
    AGENT_WORKSPACE_INIT_RETRY_ATTEMPTS: envalid.num({ default: 5 }),
    AGENT_WORKSPACE_INIT_RETRY_DELAY_MS: envalid.num({ default: 50 }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    PORT: envalid.num({ default: 3380 }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  },
);
