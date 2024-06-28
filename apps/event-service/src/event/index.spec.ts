import * as express from 'express';
import { Application } from 'express';
import { adspId } from '@abgov/adsp-service-sdk';
import { createEventRouter } from './router';
import { Logger } from 'winston';
import { createJobs } from './job';

import { applyEventMiddleware } from './index';

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
  createEventRouter: jest.fn(() => jest.fn()),
}));

jest.mock('./job', () => ({
  createJobs: jest.fn(),
}));

const tokenProviderMock = {
  getAccessToken: jest.fn(),
};

const configurationServiceMock = {
  getConfiguration: jest.fn(),
  getServiceConfiguration: jest.fn(),
};

const logger = {
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;

const mockScanJob = jest.fn();
const mockDeleteJob = jest.fn();

const eventServiceMock = {
  send: jest.fn(),
  enqueue: jest.fn(),
  getItems: jest.fn(),
  isConnected: jest.fn(),
};

const directoryServiceMock = {
  getServiceUrl: jest.fn(),
  getResourceUrl: jest.fn(),
};

const mockApp: Application = express();

describe('applyEventMiddleware', () => {
  beforeEach(() => {
    mockScanJob.mockReset();
    mockDeleteJob.mockReset();
  });

  it('should apply middleware and return the app', () => {
    const props = {
      serviceId: adspId`urn:ads:platform:event-service`,
      logger,
      directory: directoryServiceMock,
      tokenProvider: tokenProviderMock,
      configurationService: configurationServiceMock,
      eventService: eventServiceMock,
    };

    const result = applyEventMiddleware(mockApp, props);

    const routerProps = { eventService: props.eventService, logger: props.logger };
    const slicedProps = { ...props };
    delete slicedProps.eventService;
    const jobsProps = { ...slicedProps, events: props.eventService.getItems() };

    expect(createEventRouter).toHaveBeenCalledWith(expect.objectContaining(routerProps));
    expect(createJobs).toHaveBeenCalledWith(expect.objectContaining(jobsProps));
    expect(result).toBe(mockApp);
  });
});
