import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import { FETCH_CONFIG_SUCCESS_ACTION } from './actions';
import { fetchConfig } from './sagas';

jest.mock('axios');

const axiosGet = axios.get as jest.Mock;

const configJson = {
  keycloakApi: { realm: 'core', url: 'https://access.example/auth', clientId: 'tenant-management-webapp' },
  serviceUrls: { directoryServiceApiUrl: 'https://directory-service.example' },
};

const entries = [
  { service: 'tenant-service', url: 'https://tenant-service.example' },
  { service: 'project-planner-service', url: 'https://project-planner-service.example' },
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
    return { data: {} };
  });
};

const runPlannerUrl = async () => {
  const { effects } = await expectSaga(fetchConfig).withState({ config: {} }).run();
  const [action] = effects.put.map((e) => e.payload.action);
  expect(action.type).toBe(FETCH_CONFIG_SUCCESS_ACTION);
  return action.payload.serviceUrls.projectPlannerServiceApiUrl;
};

describe('config sagas', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NX_PUBLIC_PROJECT_PLANNER_SERVICE_URL;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  describe('fetchConfig project planner url', () => {
    it('falls back to the project planner service directory entry when config.json has no planner url', async () => {
      mockDirectory(entries);

      expect(await runPlannerUrl()).toBe('https://project-planner-service.example');
    });

    it('is undefined when the directory has no planner entry', async () => {
      mockDirectory(entries.filter((e) => e.service !== 'project-planner-service'));

      expect(await runPlannerUrl()).toBeUndefined();
    });

    it('uses serviceUrls.projectPlannerServiceUrl from config.json over the directory entry', async () => {
      mockDirectory(entries, plannerConfigJson);

      expect(await runPlannerUrl()).toBe('https://planner-from-config.example');
    });

    it('uses NX_PUBLIC_PROJECT_PLANNER_SERVICE_URL override when set', async () => {
      process.env.NX_PUBLIC_PROJECT_PLANNER_SERVICE_URL = 'http://localhost:3381';
      mockDirectory(entries, plannerConfigJson);

      expect(await runPlannerUrl()).toBe('http://localhost:3381');
    });
  });
});
