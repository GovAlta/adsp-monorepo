import * as express from 'express';
import { Application } from 'express';
import { adspId } from '@abgov/adsp-service-sdk';
import { createFileRouter } from './router';
import { Mock, It } from 'moq.ts';
import { Logger } from 'winston';
import { createFileJobs } from './job';
import { FileRepository } from './repository';
import { FileStorageProvider } from './storage';

import { applyFileMiddleware } from './index';
import { ScanService } from './scan';

jest.mock('node-cache', () => {
  return jest.fn().mockImplementation(() => ({
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
  }));
});

const cacheMock = jest.fn();
jest.mock('node-cache', () => {
  return class FakeCache {
    get = cacheMock;
    set = jest.fn();
  };
});

jest.mock('./router', () => ({
  createFileRouter: jest.fn(() => jest.fn()),
}));

jest.mock('./job', () => ({
  createFileJobs: jest.fn(),
}));

const tokenProviderMock = {
  getAccessToken: jest.fn(),
};

const configurationServiceMock = {
  getConfiguration: jest.fn(),
};

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;
const repositoryMock = new Mock<FileRepository>();
const scanServiceMock = new Mock<ScanService>();
const storageProviderMock = new Mock<FileStorageProvider>();
const mockScanJob = jest.fn();
const mockDeleteJob = jest.fn();

const eventServiceMock = {
  send: jest.fn(),
};

const queueServiceMock = {
  enqueue: jest.fn(),
  getItems: jest.fn(),
  isConnected: jest.fn(),
};

const tenantServiceMock = {
  getTenants: jest.fn(),
  getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
  getTenantByName: jest.fn(),
  getTenantByRealm: jest.fn(),
};

const mockApp: Application = express();

describe('applyFileMiddleware', () => {
  beforeEach(() => {
    mockScanJob.mockReset();
    mockDeleteJob.mockReset();
  });

  it('should apply middleware and return the app', () => {
    const props = {
      serviceId: adspId`urn:ads:platform:file-service`,
      logger,
      fileRepository: repositoryMock.object(),
      scanService: scanServiceMock.object(),
      queueService: queueServiceMock,
      eventService: eventServiceMock,
      tenantService: tenantServiceMock,
      configurationService: configurationServiceMock,
      tokenProvider: tokenProviderMock,
      storageProvider: storageProviderMock.object(),
      isConnected: () => false,
    };

    const result = applyFileMiddleware(mockApp, props);

    expect(createFileRouter).toHaveBeenCalledWith(expect.objectContaining(props));
    expect(createFileJobs).toHaveBeenCalledWith(expect.objectContaining(props));
    expect(result).toBe(mockApp);
  });
});
