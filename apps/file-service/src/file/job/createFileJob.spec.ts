import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Mock } from 'moq.ts';
import { Logger } from 'winston';
import { FileEntity } from '../model';
import { FileRepository } from '../repository';
import { createFileJobs, FileServiceWorkItem } from './index';
import { ScanService } from '../scan';

import * as scanModule from './scan';
import * as deleteModule from './delete';

describe('Create File Job', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;
  let repositoryMock: Mock<FileRepository> = null;

  let queueServiceMock = null;

  jest.mock('./scan');

  const mockScanJob = jest.fn();
  const mockDeleteJob = jest.fn();
  jest.spyOn(scanModule, 'createScanJob').mockImplementation(() => mockScanJob);
  jest.spyOn(deleteModule, 'createDeleteJob').mockImplementation(() => mockDeleteJob);

  const eventServiceMock = {
    send: jest.fn(),
  };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  let scanServiceMock: Mock<ScanService> = null;

  const fileEntityMock = new Mock<FileEntity>();
  fileEntityMock.setup((instance) => instance.deleted).returns(false);
  fileEntityMock.setup((instance) => instance.updateScanResult(true)).returns(Promise.resolve(fileEntityMock.object()));

  beforeEach(() => {
    repositoryMock = new Mock<FileRepository>();
    scanServiceMock = new Mock<ScanService>();

    mockScanJob.mockReset();
    mockDeleteJob.mockReset();
  });

  const configurationService = {
    getConfiguration: jest.fn(() => Promise.resolve({})),
  };

  it('can run scan job', () => {
    queueServiceMock = {
      enqueue: jest.fn(),
      getItems: jest.fn().mockReturnValue({
        subscribe: (callback) => {
          callback({
            item: { tenantId: adspId`urn:ads:platform:test:v2:/tenants/test-2`, work: 'scan', file: jest.fn() },
            done: jest.fn(),
          });
        },
      }),
    };
    createFileJobs({
      apiId: adspId`urn:ads:platform:file-service`,
      serviceId: adspId`urn:ads:platform:file-service`,
      logger,
      fileRepository: repositoryMock.object(),
      scanService: scanServiceMock.object(),
      queueService: queueServiceMock as unknown as WorkQueueService<FileServiceWorkItem>,
      eventService: eventServiceMock,
      tenantService: tenantServiceMock,
      configurationService: configurationService as unknown as ConfigurationService,
      tokenProvider: tokenProviderMock,
    });

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: true, infected: true }));

    expect(scanModule.createScanJob).toHaveBeenCalled();
    expect(mockScanJob).toHaveBeenCalled();
  });
  it('can run delete job', () => {
    queueServiceMock = {
      enqueue: jest.fn(),
      getItems: jest.fn().mockReturnValue({
        subscribe: (callback) => {
          callback({
            item: { tenantId: adspId`urn:ads:platform:test:v2:/tenants/test-2`, work: 'delete', file: jest.fn() },
            done: jest.fn(),
          });
        },
      }),
    };
    createFileJobs({
      apiId: adspId`urn:ads:platform:file-service`,
      serviceId: adspId`urn:ads:platform:file-service`,
      logger,
      fileRepository: repositoryMock.object(),
      scanService: scanServiceMock.object(),
      queueService: queueServiceMock as unknown as WorkQueueService<FileServiceWorkItem>,
      eventService: eventServiceMock,
      tenantService: tenantServiceMock,
      configurationService: configurationService as unknown as ConfigurationService,
      tokenProvider: tokenProviderMock,
    });

    scanServiceMock
      .setup((instance) => instance.scan(fileEntityMock.object()))
      .returns(Promise.resolve({ scanned: true, infected: true }));

    expect(deleteModule.createDeleteJob).toHaveBeenCalled();
    expect(mockDeleteJob).toHaveBeenCalled();
  });

  it('runs nothing because we do not have valid case', () => {
    queueServiceMock = {
      enqueue: jest.fn(),
      getItems: jest.fn().mockReturnValue({
        subscribe: (callback) => {
          callback({
            item: { tenantId: adspId`urn:ads:platform:test:v2:/tenants/test-2`, work: 'stuff', file: jest.fn() },
            done: jest.fn(),
          });
        },
      }),
    };
    createFileJobs({
      apiId: adspId`urn:ads:platform:file-service`,
      serviceId: adspId`urn:ads:platform:file-service`,
      logger,
      fileRepository: repositoryMock.object(),
      scanService: scanServiceMock.object(),
      queueService: queueServiceMock as unknown as WorkQueueService<FileServiceWorkItem>,
      eventService: eventServiceMock,
      tenantService: tenantServiceMock,
      configurationService: configurationService as unknown as ConfigurationService,
      tokenProvider: tokenProviderMock,
    });

    expect(mockDeleteJob).not.toHaveBeenCalled();
    expect(mockScanJob).not.toHaveBeenCalled();
  });
});
