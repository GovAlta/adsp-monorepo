import * as dotenv from 'dotenv';
import * as envalid from 'envalid';
import * as util from 'util';

dotenv.config();

const reasoningEffortChoices = ['', 'none', 'minimal', 'low', 'medium', 'high', 'xhigh', 'max'] as const;

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
    AGENT_REQUEST_TIMEOUT_MS: envalid.num({ default: 240000 }),
    // Tool calls the chat agent may make in one turn. The plan's own cap is MAX_PLAN_STEPS in llm/planner.ts.
    AGENT_FORM_GENERATION_MAX_STEPS: envalid.num({ default: 12 }),
    // Generation is a long multi-call job, so it replaces AGENT_REQUEST_TIMEOUT_MS for this agent only.
    AGENT_FORM_GENERATION_TIMEOUT_MS: envalid.num({ default: 900000 }),
    // Overrides MODEL for every generation call: chat agent, planner and step builder.
    AGENT_FORM_GENERATION_MODEL: envalid.str({ default: '' }),
    // Narrows the above to step building, which is mechanical enough to run on a smaller model than planning.
    AGENT_FORM_GENERATION_STEP_MODEL: envalid.str({ default: '' }),
    // Effort for the chat agent, and the fallback for the two role overrides below.
    AGENT_FORM_GENERATION_REASONING_EFFORT: envalid.str({ default: '', choices: reasoningEffortChoices }),
    // Planning is one judgement-heavy call; step building is many mechanical ones and sets the wall clock.
    AGENT_FORM_GENERATION_PLANNER_REASONING_EFFORT: envalid.str({ default: '', choices: reasoningEffortChoices }),
    AGENT_FORM_GENERATION_STEP_REASONING_EFFORT: envalid.str({ default: '', choices: reasoningEffortChoices }),
    AGENT_MCP_SERVER_CREDENTIALS_FILE: envalid.str({ default: '/var/run/secrets/adsp/mcp/mcp-servers.json' }),
    AGENT_WORKSPACE_INIT_RETRY_ATTEMPTS: envalid.num({ default: 5 }),
    AGENT_WORKSPACE_INIT_RETRY_DELAY_MS: envalid.num({ default: 50 }),
    OTEL_EXPORTER_OTLP_ENDPOINT: envalid.str({ default: '' }),
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
