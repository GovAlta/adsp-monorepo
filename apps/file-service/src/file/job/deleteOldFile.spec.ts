import * as timekeeper from 'timekeeper';
import { adspId, ConfigurationService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { Mock } from 'moq.ts';
import { FileRepository } from '../repository';

import { getBeforeLastAccessed } from './deleteOldFiles';
import { createDeleteOldFilesJob } from './deleteOldFiles';
import { FileEntity } from '../model';
import { Results } from '@core-services/core-common';

describe('Delete old files', () => {
  it('can return correct before last accessed date', () => {
    timekeeper.freeze(new Date('2023-07-01T00:00:00.000Z'));

    const Day30Before1 = getBeforeLastAccessed(30);
    expect(Day30Before1).toBe('2023-06-01T00:00:00.000Z');
    timekeeper.reset();

    timekeeper.freeze(new Date('2023-07-01T18:00:00.000Z'));
    const Day30Before2 = getBeforeLastAccessed(30);
    // Test whether we can set the time to last middle night.
    expect(Day30Before2).toBe('2023-06-01T00:00:00.000Z');

    // Test retention period with float format. This is only for test purpose. Not expect to have non integer retention period
    const Day40Before = getBeforeLastAccessed(40.5);
    expect(Day40Before).toBe('2023-05-22T00:00:00.000Z');
    timekeeper.reset();
  });

  const configurationServiceMockZero = {
    getConfiguration: jest.fn(),
    getServiceConfiguration: jest.fn(),
  };

  const configurationService = {
    getConfiguration: jest.fn(() => Promise.resolve({})),
    getServiceConfiguration: jest.fn(),
  };

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const tenantId = adspId`urn:ads:platform:file-service:v2:/tenants/test`;

  const tenantServiceMock = {
    getTenants: jest.fn(() => Promise.resolve([{ id: tenantId, name: 'test-mock', realm: 'test' }])),
    getTenant: jest.fn((id) => Promise.resolve({ id, name: 'Test', realm: 'test' })),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  let repositoryMock: Mock<FileRepository> = null;

  const entity = new FileEntity(null, null, null, {
    tenantId,
    id: 'file-1',
    filename: 'test.txt',
    recordId: 'my-record-1',
    size: 100,
    created: new Date(),
    createdBy: {
      id: 'user-1',
      name: 'testy',
    },
    scanned: false,
    deleted: false,
    infected: false,
  });

  const fileServiceMock = {
    find: jest.fn(async (tenantIdFound): Promise<Results<FileEntity>> => {
      if (tenantId === tenantIdFound) {
        return { results: [entity], page: { after: 'abc-123', size: 10 } };
      } else {
        return {
          results: [entity],
          page: { after: 'abc-123', size: null },
        };
      }
    }),
    get: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  beforeEach(() => {
    repositoryMock = new Mock<FileRepository>();
  });

  it('can create a delete old files job', () => {
    const deleteJob = createDeleteOldFilesJob({
      apiId: adspId`urn:ads:platform:file-service`,
      serviceId: adspId`urn:ads:platform:file-service`,
      logger,
      fileRepository: repositoryMock.object(),
      configurationService: configurationServiceMockZero,
      tenantService: tenantServiceMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
    });

    expect(deleteJob).toBeTruthy();
  });
  it('can be executed', async () => {
    jest.spyOn(entity, 'markForDeletion').mockResolvedValue(
      new FileEntity(null, null, null, {
        tenantId,
        id: 'file-1',
        filename: 'test.txt',
        recordId: 'my-record-1',
        size: 100,
        created: new Date(),
        createdBy: {
          id: 'user-1',
          name: 'testy',
        },
        scanned: false,
        deleted: false,
        infected: false,
      })
    );

    const deleteJob = createDeleteOldFilesJob({
      apiId: adspId`urn:ads:platform:file-service`,
      serviceId: adspId`urn:ads:platform:file-service`,
      logger,
      fileRepository: fileServiceMock,
      configurationService: configurationService as unknown as ConfigurationService,
      tenantService: tenantServiceMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
    });

    configurationService.getConfiguration.mockResolvedValueOnce({
      a: { rules: { retention: { active: true, deleteInDays: 12 } } },
    });

    await deleteJob();

    expect(deleteJob).toBeTruthy();
  });
  it('can be executed but ', async () => {
    jest.spyOn(entity, 'markForDeletion').mockResolvedValue(
      new FileEntity(null, null, null, {
        tenantId,
        id: 'file-1',
        filename: 'test.txt',
        recordId: 'my-record-1',
        size: 100,
        created: new Date(),
        createdBy: {
          id: 'user-1',
          name: 'testy',
        },
        scanned: false,
        deleted: false,
        infected: false,
      })
    );

    const deleteJob = createDeleteOldFilesJob({
      apiId: adspId`urn:ads:platform:file-service`,
      serviceId: adspId`urn:ads:platform:file-service`,
      logger,
      fileRepository: fileServiceMock,
      configurationService: configurationService as unknown as ConfigurationService,
      tenantService: tenantServiceMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
    });

    configurationService.getConfiguration.mockResolvedValueOnce({
      a: { rules: { retention: null } },
    });

    await deleteJob();

    expect(deleteJob).toBeTruthy();
  });
  it('can be executed but markfordeletion throws an error ', async () => {
    jest.spyOn(entity, 'markForDeletion').mockRejectedValue(new Error('Mocked error'));

    const deleteJob = createDeleteOldFilesJob({
      apiId: adspId`urn:ads:platform:file-service`,
      serviceId: adspId`urn:ads:platform:file-service`,
      logger,
      fileRepository: fileServiceMock,
      configurationService: configurationService as unknown as ConfigurationService,
      tenantService: tenantServiceMock,
      tokenProvider: tokenProviderMock,
      eventService: eventServiceMock,
    });

    configurationService.getConfiguration.mockResolvedValueOnce({
      a: { rules: { retention: null } },
    });

    await deleteJob();

    expect(entity.markForDeletion).toHaveBeenCalled();
  });
});
