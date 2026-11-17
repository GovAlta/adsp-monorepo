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
    // Unobserved message tokens at which observational memory summarises older messages (Mastra's default).
    AGENT_OM_MESSAGE_TOKENS: envalid.num({ default: 30000 }),
    // Observation tokens at which observational memory condenses its notes (Mastra's default).
    AGENT_OM_OBSERVATION_TOKENS: envalid.num({ default: 40000 }),
    // Context window of the configured model, used to show users how much of it a conversation takes up.
    AGENT_MODEL_CONTEXT_TOKENS: envalid.num({ default: 256000 }),
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
    // The Access Service agent keeps a short history without observational memory: its tool results are shown as
    // cards, and observational memory's background summaries cost more tokens than they save for short chats.
    AGENT_ACCESS_LAST_MESSAGES: envalid.num({ default: 8 }),
    AGENT_ACCESS_MAX_OUTPUT_TOKENS: envalid.num({ default: 1000 }),
    // Context tokens at which the Access Service agent suggests starting a new chat; 0 turns the suggestion off.
    AGENT_ACCESS_LONG_CONVERSATION_TOKENS: envalid.num({ default: 6000 }),
    // Token budget for the model key shared by every agent; 0 turns a limit off. Each pod enforces its own budget,
    // so with several pods set these to the key's limit divided by the number of pods.
    AGENT_TOKEN_LIMIT_PER_MINUTE: envalid.num({ default: 0 }),
    AGENT_TOKEN_LIMIT_PER_5_MINUTES: envalid.num({ default: 0 }),
    // Share of the budget each agent may use, for example "AccessServiceAgent=0.3,formGenerationAgent=0.5".
    AGENT_TOKEN_AGENT_SHARES: envalid.str({ default: '' }),
    AGENT_USER_TOKEN_LIMIT_PER_MINUTE: envalid.num({ default: 0 }),
    // Share of a budget at which a warning is logged.
    AGENT_TOKEN_WARN_RATIO: envalid.num({ default: 0.7 }),
    AGENT_MCP_SERVER_CREDENTIALS_FILE: envalid.str({ default: '/var/run/secrets/adsp/mcp/mcp-servers.json' }),
    AGENT_WORKSPACE_INIT_RETRY_ATTEMPTS: envalid.num({ default: 5 }),
    AGENT_WORKSPACE_INIT_RETRY_DELAY_MS: envalid.num({ default: 50 }),
    OTEL_EXPORTER_OTLP_ENDPOINT: envalid.str({ default: '' }),
    LOG_LEVEL: envalid.str({ default: 'debug' }),
    PORT: envalid.num({ default: 3380 }),
    TRUSTED_PROXY: envalid.str({ default: 'uniquelocal' }),
    // Unset follows AUDIT_ENABLED; false turns audit recording off for this service.
    AGENT_AUDIT_ENABLED: envalid.bool({ default: undefined }),
  },
  {
    reporter: ({ errors }) => {
      if (Object.keys(errors).length !== 0) {
        console.error(`Invalid env vars: ${util.inspect(errors)}`);
      }
    },
  },
);
