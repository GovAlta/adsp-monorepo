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
