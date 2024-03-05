import * as timekeeper from 'timekeeper';
import { adspId, ConfigurationService, User } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { Mock, It } from 'moq.ts';
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

  // const configurationServiceMock = {
  //   getConfiguration: jest.fn(() => Promise.resolve({})),
  // };
  const configurationServiceMockZero = {
    getConfiguration: jest.fn(),
  };

  const configurationService = {
    getConfiguration: jest.fn(() => Promise.resolve({})),
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
  // let storageProviderMock = new Mock<FileStorageProvider>();

  // storageProviderMock
  //   .setup((m) => m.saveFile(It.IsAny(), It.IsAny(), contentMock.object()))
  //   .returns(Promise.resolve(true));

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
    find: jest.fn(async (tenantIdFound, pageSize, after, options): Promise<Results<FileEntity>> => {
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
    const user: User = {
      id: 'user-2',
      name: 'testy',
      email: 'test@testco.org',
      roles: ['test-admin'],
      tenantId,
      isCore: false,
      token: null,
    };
    const fileEntityMock = new Mock<FileEntity>();

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
        retentionDays: 7,
      })
    );

    const deleteJob = createDeleteOldFilesJob({
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
    const user: User = {
      id: 'user-2',
      name: 'testy',
      email: 'test@testco.org',
      roles: ['test-admin'],
      tenantId,
      isCore: false,
      token: null,
    };
    const fileEntityMock = new Mock<FileEntity>();

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
        retentionDays: 7,
      })
    );

    const deleteJob = createDeleteOldFilesJob({
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
    const user: User = {
      id: 'user-2',
      name: 'testy',
      email: 'test@testco.org',
      roles: ['test-admin'],
      tenantId,
      isCore: false,
      token: null,
    };
    const fileEntityMock = new Mock<FileEntity>();

    jest.spyOn(entity, 'markForDeletion').mockRejectedValue(new Error('Mocked error'));

    const deleteJob = createDeleteOldFilesJob({
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

    // Mock the behavior of the markForDeletion method to throw an error

    // Call the method and expect it to throw an error
    expect(entity.markForDeletion).toHaveBeenCalled();
  });
});
