import { Response } from 'express';
import { Logger } from 'winston';
import { adspId } from '@abgov/adsp-service-sdk';

export const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

export const loggerMock = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

export const tenantServiceMock = {
  getTenants: jest.fn(() => Promise.resolve([{ id: tenantId, name: 'test-mock', realm: 'test' }])),
  getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
  getTenantByName: jest.fn(),
  getTenantByRealm: jest.fn(),
};

export const eventServiceMock = {
  send: jest.fn(),
};

export const endpointRepositoryMock = {
  findRecentByUrl: jest.fn(),
  deleteOldUrlStatus: jest.fn(),
  get: jest.fn(),
  find: jest.fn(),
  save: jest.fn((entity) => Promise.resolve(entity)),
  delete: jest.fn(),
};

export const nextMock = jest.fn();

export const applicationsMock = [
  {
    repository: {},
    _id: '620ae946ddd181001195caad',
    endpoint: { status: 'online', url: 'https://www.yahoo.com' },
    metadata: '',
    name: 'MyApp 1',
    description: 'MyApp',
    statusTimestamp: 1648247257463,
    tenantId: tenantId.toString(),
    tenantName: 'Platform',
    tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
    status: 'operational',
    enabled: true,
    internalStatus: 'healthy',
  },
  {
    repository: {},
    _id: '624365fe3367d200110e17c5',
    endpoint: { status: 'offline', url: 'https://localhost.com' },
    metadata: '',
    name: 'test-mock',
    description: '',
    statusTimestamp: 0,
    tennantServRef: '{}',
    tenantId: tenantId.toString(),
    tenantName: 'Platform',
    tenantRealm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
    enabled: false,
    internalStatus: 'stopped',
    status: 'offline',
    enable: jest.fn((app) => {
      return {
        ...app,
        enabled: true,
      };
    }),

    disable: jest.fn((app) => {
      return {
        ...app,
        enabled: false,
      };
    }),
    setStatus: jest.fn(() =>
      Promise.resolve({
        name: 'status-updated-app',
        internalStatus: 'stopped',
      })
    ),
    update: jest.fn(() =>
      Promise.resolve({
        name: 'updated-app',
        internalStatus: 'stopped',
        tennantServRef: '{}',
      })
    ),
    delete: jest.fn(() => Promise.resolve()),
    canAccessById: jest.fn(() => {
      return true;
    }),
  },
];

export const entriesMock = [
  {
    repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
    ok: true,
    url: 'https://www.yahoo.com',
    timestamp: 1649277360004,
    responseTime: 685,
    status: '200',
  },
  {
    repository: { opts: { limit: 200, everyMilliseconds: 60000 } },
    ok: true,
    url: 'https://www.yahoo.com',
    timestamp: 1649277300002,
    responseTime: 514,
    status: '200',
  },
];

export const statusRepositoryMock = {
  findEnabledApplications: jest.fn(),
  enable: jest.fn(),
  disable: jest.fn(),
  get: jest.fn(),
  find: jest.fn(),
  save: jest.fn((entity) => Promise.resolve(entity)),
  delete: jest.fn(),
  setStatus: jest.fn(),
};

export const resMock = {
  json: jest.fn(),
  sendStatus: jest.fn(),
  send: jest.fn(),
  status: jest.fn(() => {
    return {
      json: jest.fn(),
    };
  }),
} as unknown as Response;

export const noticeRepositoryMock = {
  find: jest.fn(),
  delete: jest.fn(),
  save: jest.fn(),
  get: jest.fn(),
};

export const statusNoticeMock = {
  message: 'test mock',
  tennantServRef: '{}',
  startDate: '2022-04-07T16:00:00.000',
  endDate: '2022-04-07T20:00:00.000Z',
  isAllApplications: true,
};

export const findApplicationsResponseMock = {
  page: 1,
  results: [
    {
      mode: 'active',
      tennantServRef: '{}',
    },
  ],
};

export const updateNoticePayloadMock = {
  id: '624f4ff79d71d0001135a6f2',
  message: 'test-mock',
  tennantServRef: [
    {
      id: '624cbda156bd8200125eda68',
      name: 'mock-test',
    },
  ],
  startDate: '2022-04-07T16:00:00.000Z',
  endDate: '2022-04-07T20:00:00.000Z',
  isAllApplications: false,
};
