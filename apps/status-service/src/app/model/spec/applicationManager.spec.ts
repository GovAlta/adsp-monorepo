import { adspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { ApplicationManager } from '../applicationManager';

jest.mock('axios');

const repositoryMock = {
  findRecentByUrlAndApplicationId: jest.fn(),
  deleteOldUrlStatus: jest.fn(),
  findEnabledApplications: jest.fn(),
  find: jest.fn(),
  disable: jest.fn(),
  enable: jest.fn(),
  delete: jest.fn(),
  get: jest.fn(),
  save: jest.fn(),
};

const loggerMock = {
  info: jest.fn((msg) => console.log(msg)),
} as unknown as Logger;

const tokenProviderMock = {
  getAccessToken: jest.fn(() => Promise.resolve('Toot!')),
};

const configurationServiceMock = {
  getConfiguration: jest.fn(),
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

const statusMock = [
  {
    _id: '620ae946ddd181001195caad',
    name: 'temp app name 1',
    endpoint: { status: 'online' },
    metadata: '',
    statusTimestamp: 1648247257463,
    tenantId: 'urn:ads:mock-tenant:mock-service:bob:bobs-id',
    tenantName: 'Platform',
    tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
    status: 'operational',
    enabled: true,
    internalStatus: 'healthy',
  },
  {
    _id: '620ae946ddd181001195cbbc',
    name: 'temp app name 2',
    endpoint: { status: 'online' },
    metadata: '',
    statusTimestamp: 1648247257464,
    tenantId: 'urn:ads:mock-tenant:mock-service:bill:bills-id',
    tenantName: 'Platform',
    tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
    status: 'operational',
    enabled: true,
    internalStatus: 'healthy',
  },
];

const appMock = [
  {
    [statusMock[0]._id]: {
      name: 'MyApp 1',
      url: 'https://www.yahoo.com',
      description: 'MyApp goes to Hollywood',
    },
  },
  {
    [statusMock[1]._id]: {
      name: 'MyApp 2',
      url: 'https://www.google.com',
      description: 'MyApp - the sequel',
    },
  },
];

describe('Application Manager', () => {
  it('Can get Active Applications', async () => {
    const appManager = appManagerFactory('urn:ads:mock-tenant:mock-service');

    repositoryMock.findEnabledApplications.mockResolvedValueOnce(statusMock);
    configurationServiceMock.getConfiguration.mockResolvedValueOnce(appMock[0]).mockResolvedValueOnce(appMock[1]);
    const apps = await appManager.getActiveApps();
    expect(apps[statusMock[1]._id]).toEqual({
      ...statusMock[1],
      ...appMock[1][statusMock[1]._id],
    });
  });

  const appManagerFactory = (service: string): ApplicationManager => {
    return new ApplicationManager(
      tokenProviderMock,
      configurationServiceMock,
      adspId`${service}`,
      repositoryMock,
      directoryServiceMock,
      tenantServiceMock,
      loggerMock
    );
  };
});
