import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import { ERROR_NOTIFICATION } from '../notifications/actions';
import { FETCH_CONFIG_SUCCESS_ACTION } from './actions';
import { fetchConfig } from './sagas';

jest.mock('axios');

const axiosGet = axios.get as jest.Mock;

const directoryUrl = 'https://directory-service.example';
const feedbackUrl = 'https://feedback-service.example';
const integrity = 'sha384-0123456789012345678901234567890123456789ABCDEFGH';

const configJson = {
  keycloakApi: { realm: 'core', url: 'https://access.example/auth', clientId: 'tenant-management-webapp' },
  serviceUrls: {
    directoryServiceApiUrl: directoryUrl,
    uiComponentUrl: 'https://ui.example',
    chatServiceApiUrl: 'https://chat.example',
    formServiceUrl: 'https://form.example',
  },
  featureFlags: { Form: true },
  feedback: { tenant: 'alberta' },
};

const entries = [
  { service: 'tenant-service', url: 'https://tenant-service.example' },
  { service: 'access-service', url: 'https://access-service.example' },
  { service: 'agent-service', url: 'https://agent-service.example' },
  { service: 'project-planner-service', url: 'https://project-planner-service.example' },
  { service: 'token-handler', url: 'https://token-handler.example' },
];

const plannerConfigJson = {
  ...configJson,
  serviceUrls: { ...configJson.serviceUrls, projectPlannerServiceUrl: 'https://planner-from-config.example' },
};

const mockDirectory = (directoryEntries: { service: string; url: string }[], config: unknown = configJson) => {
  axiosGet.mockImplementation(async (url: string) => {
    if (url === '/config/config.json?v=2') {
      return { data: config };
    }
    if (url.endsWith('/directory/v2/namespaces/platform/entries')) {
      return { data: directoryEntries };
    }
    return { data: { integrity } };
  });
};

const runSaga = (state: unknown = { config: {} }) => expectSaga(fetchConfig).withState(state);

describe('config sagas', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NX_DIRECTORY_URL;
    delete process.env.NX_KEYCLOAK_URL;
    delete process.env.NX_AGENT_SERVICE_PROXY;
    delete process.env.NX_PUBLIC_PROJECT_PLANNER_SERVICE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  describe('fetchConfig', () => {
    it('falls back to the project planner service directory entry when config.json has no planner url', async () => {
      mockDirectory(entries);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.type).toBe(FETCH_CONFIG_SUCCESS_ACTION);
      expect(action.payload.serviceUrls.projectPlannerServiceApiUrl).toBe('https://project-planner-service.example');
    });

    it('leaves projectPlannerServiceApiUrl undefined when the directory has no planner entry', async () => {
      mockDirectory(entries.filter((e) => e.service !== 'project-planner-service'));

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.serviceUrls.projectPlannerServiceApiUrl).toBeUndefined();
    });

    it('uses serviceUrls.projectPlannerServiceUrl from config.json over the directory entry', async () => {
      mockDirectory(entries, plannerConfigJson);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.serviceUrls.projectPlannerServiceApiUrl).toBe('https://planner-from-config.example');
    });

    it('uses NX_PUBLIC_PROJECT_PLANNER_SERVICE_URL override when set', async () => {
      process.env.NX_PUBLIC_PROJECT_PLANNER_SERVICE_URL = 'http://localhost:3381';
      mockDirectory(entries, plannerConfigJson);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.serviceUrls.projectPlannerServiceApiUrl).toBe('http://localhost:3381');
    });

    it('maps the token handler directory entry to tokenHandlerApiUrl', async () => {
      mockDirectory(entries);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.serviceUrls.tokenHandlerApiUrl).toBe('https://token-handler.example');
    });

    it('requests the directory entries from the configured directory service', async () => {
      mockDirectory(entries);

      await runSaga().run();

      expect(axiosGet).toHaveBeenCalledWith(`${directoryUrl}/directory/v2/namespaces/platform/entries`);
    });

    it('uses NX_DIRECTORY_URL override when set', async () => {
      process.env.NX_DIRECTORY_URL = 'http://localhost:3331';
      mockDirectory(entries);

      await runSaga().run();

      expect(axiosGet).toHaveBeenCalledWith('http://localhost:3331/directory/v2/namespaces/platform/entries');
    });

    it('uses the keycloak url from config.json by default', async () => {
      mockDirectory(entries);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.keycloakApi.url).toBe('https://access.example/auth');
    });

    it('uses NX_KEYCLOAK_URL override when set', async () => {
      process.env.NX_KEYCLOAK_URL = 'http://localhost:8080';
      mockDirectory(entries);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.keycloakApi.url).toBe('http://localhost:8080');
    });

    it('uses the agent service directory entry by default', async () => {
      mockDirectory(entries);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.serviceUrls.agentServiceApiUrl).toBe('https://agent-service.example');
    });

    it('uses the window origin for the agent service when NX_AGENT_SERVICE_PROXY is true', async () => {
      process.env.NX_AGENT_SERVICE_PROXY = 'true';
      mockDirectory(entries);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.serviceUrls.agentServiceApiUrl).toBe(window.location.origin);
    });

    it('merges feature flags from config.json over the defaults', async () => {
      mockDirectory(entries);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.featureFlags.Form).toBe(true);
    });

    it('omits feedback configuration when there is no feedback service entry', async () => {
      mockDirectory(entries);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.feedback).toBeUndefined();
    });

    it('sets feedback script and tenant when a feedback service entry exists', async () => {
      mockDirectory([...entries, { service: 'feedback-service', url: feedbackUrl }]);

      const { effects } = await runSaga().run();

      const [action] = effects.put.map((e) => e.payload.action);
      expect(action.payload.feedback).toEqual({
        script: {
          src: new URL(`/feedback/v1/script/adspFeedback.js?${integrity.substring(40)}`, feedbackUrl),
          integrity,
        },
        tenant: 'alberta',
      });
    });

    it('does not fetch configuration when the keycloak realm is already loaded', async () => {
      const state = { config: { keycloakApi: { realm: 'core' } } };

      await runSaga(state).not.put.actionType(FETCH_CONFIG_SUCCESS_ACTION).run();

      expect(axiosGet).not.toHaveBeenCalled();
    });

    it('dispatches an error notification when the config request fails', async () => {
      axiosGet.mockRejectedValue(new Error('Network Error'));

      await runSaga().put.actionType(ERROR_NOTIFICATION).run();

      expect(axiosGet).toHaveBeenCalledTimes(1);
    });
  });
});
