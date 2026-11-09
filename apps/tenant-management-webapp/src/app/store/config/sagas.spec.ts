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

const mockDirectory = (directoryEntries: { service: string; url: string }[]) => {
  axiosGet.mockImplementation(async (url: string) => {
    if (url === '/config/config.json?v=2') {
      return { data: configJson };
    }
    if (url.endsWith('/directory/v2/namespaces/platform/entries')) {
      return { data: directoryEntries };
    }
    return { data: {} };
  });
};

const fetchServiceUrls = async () => {
  const { effects } = await expectSaga(fetchConfig).withState({ config: {} }).run();
  const [action] = effects.put.map((e) => e.payload.action);
  expect(action.type).toBe(FETCH_CONFIG_SUCCESS_ACTION);
  return action.payload.serviceUrls;
};

describe('fetchConfig', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('takes the project planner app URL from the directory', async () => {
    mockDirectory([{ service: 'project-planner-app', url: 'https://planner.example' }]);

    expect((await fetchServiceUrls()).projectPlannerWebApp).toBe('https://planner.example');
  });
});

const entries = [{ service: 'tenant-service', url: 'https://tenant-service.example' }];
const sharepointEntry = { service: 'sharepoint-service', url: 'https://sharepoint-service.example' };

const runConfig = async () => {
  const { effects } = await expectSaga(fetchConfig).withState({ config: {} }).run();
  const [action] = effects.put.map((e) => e.payload.action);
  expect(action.type).toBe(FETCH_CONFIG_SUCCESS_ACTION);
  return action.payload;
};

describe('fetchConfig sharepoint url and feature flags', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.NX_PUBLIC_SHAREPOINT_SERVICE_URL;
    delete process.env.NX_PUBLIC_FEATURE_FLAGS;
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.resetAllMocks();
  });

  it('uses the sharepoint service directory entry', async () => {
    mockDirectory([...entries, sharepointEntry]);
    expect((await runConfig()).serviceUrls.sharepointServiceApiUrl).toBe('https://sharepoint-service.example');
  });

  it('uses NX_PUBLIC_SHAREPOINT_SERVICE_URL when set', async () => {
    process.env.NX_PUBLIC_SHAREPOINT_SERVICE_URL = 'http://localhost:3350';
    mockDirectory([...entries, sharepointEntry]);
    expect((await runConfig()).serviceUrls.sharepointServiceApiUrl).toBe('http://localhost:3350');
  });

  it('applies NX_PUBLIC_FEATURE_FLAGS over config.json', async () => {
    process.env.NX_PUBLIC_FEATURE_FLAGS = '{"SharePoint":true}';
    mockDirectory(entries);
    expect((await runConfig()).featureFlags.SharePoint).toBe(true);
  });

  it('ignores malformed NX_PUBLIC_FEATURE_FLAGS', async () => {
    process.env.NX_PUBLIC_FEATURE_FLAGS = 'not json';
    mockDirectory(entries);
    expect((await runConfig()).featureFlags.SharePoint).toBe(false);
  });
});
