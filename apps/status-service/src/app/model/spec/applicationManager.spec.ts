import { adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { EndpointStatusEntryRepository } from '../../repository/endpointStatusEntry';
import { ApplicationManager } from '../applicationManager';

jest.mock('axios');

const repositoryMock = {
  findRecentByUrlAndApplicationId: jest.fn(),
  findRecent: jest.fn(),
  deleteOldUrlStatus: jest.fn(),
  findEnabledApplications: jest.fn(),
  find: jest.fn(),
  disable: jest.fn(),
  enable: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  save: jest.fn(),
};

const endpointRepoMock: EndpointStatusEntryRepository = {
  delete: jest.fn(),
  deleteAll: jest.fn(),
  save: jest.fn(),
  get: jest.fn(),
  findRecentByUrlAndApplicationId: jest.fn(),
  findRecent: jest.fn(),
  deleteOldUrlStatus: jest.fn(),
};

const loggerMock = {
  info: jest.fn((msg) => console.log(msg)),
} as unknown as Logger;

const tokenProviderMock = {
  getAccessToken: jest.fn(() => Promise.resolve('Toot!')),
};

const configurationServiceMock = {
  getConfiguration: jest.fn(),
  getServiceConfiguration: jest.fn(),
};

const directoryServiceMock = {
  getServiceUrl: jest.fn(),
  getResourceUrl: jest.fn(),
};

const tenantServiceMock = {
  getTenants: jest.fn(),
  getTenantByName: jest.fn(),
  getTenant: jest.fn(),
  getTenantByRealm: jest.fn(),
};

const tenant1 = 'urn:ads:mock-tenant:mock-service:bob:bobs-id';
const tenant2 = 'urn:ads:mock-tenant:mock-service:bill:bills-id';

const statusMock = [
  {
    _id: '620ae946ddd181001195caad',
    appKey: 'app_temp-app-name-1',
    endpoint: { status: 'online' },
    metadata: '',
    statusTimestamp: 1648247257463,
    status: 'operational',
    enabled: true,
    internalStatus: 'healthy',
    tenantId: tenant1,
  },
  {
    _id: '620ae946ddd181001195cbbc',
    appKey: 'app_temp-app-name-2',
    endpoint: { status: 'online' },
    metadata: '',
    statusTimestamp: 1648247257464,
    status: 'operational',
    enabled: true,
    internalStatus: 'healthy',
    tenantId: tenant2,
  },
];

const appMock = [
  {
    contact: { contactEmail: 'bob@bob.com' },
    ['app_temp-app-name-1']: {
      appKey: 'app_temp-app-name-1',
      name: 'temp app name 1',
      url: 'https://www.yahoo.com',
      description: 'MyApp goes to Hollywood',
    },
  },
  {
    ['app_temp-app-name-2']: {
      appKey: 'app_temp-app-name-2',
      name: 'temp app name 2',
      url: 'https://www.google.com',
      description: 'MyApp - the sequel',
    },
  },
];

describe('Application Manager', () => {
  it('Can get Active Applications', async () => {
    const appManager = appManagerFactory('urn:ads:mock-tenant:mock-service');
    tenantServiceMock.getTenants.mockResolvedValue([{ id: tenant1 }, { id: tenant2 }]);
    repositoryMock.findEnabledApplications
      .mockResolvedValueOnce([statusMock[0]])
      .mockResolvedValueOnce([statusMock[1]]);
    configurationServiceMock.getConfiguration.mockResolvedValueOnce(appMock[0]).mockResolvedValueOnce(appMock[1]);
    const apps = await appManager.findEnabledApps();
    expect(apps.size()).toBe(2);
    const actual = apps.get(statusMock[1].appKey);
    expect(actual).toEqual({ ...appMock[1][statusMock[1].appKey], tenantId: tenant2 });
  });

  const appManagerFactory = (service: string): ApplicationManager => {
    return new ApplicationManager(
      tokenProviderMock,
      configurationServiceMock,
      adspId`${service}`,
      repositoryMock,
      endpointRepoMock,
      directoryServiceMock,
      tenantServiceMock,
      loggerMock
    );
  };
});
