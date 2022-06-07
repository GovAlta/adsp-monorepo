import { adspId, Channel } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { FormDefinitionEntity, FormEntity } from '../model';
import { FormStatus } from '../types';
import { createDeleteJob } from './delete';

describe('delete', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const repositoryMock = {
    find: jest.fn(),
    get: jest.fn(),
    save: jest.fn((save) => Promise.resolve(save)),
    delete: jest.fn(),
  };

  const eventServiceMock = {
    send: jest.fn(),
  };

  const fileServiceMock = {
    delete: jest.fn(),
  };

  const notificationServiceMock = {
    getSubscriber: jest.fn(),
    subscribe: jest.fn(),
    unsubscribe: jest.fn(),
    sendCode: jest.fn(),
    verifyCode: jest.fn(),
  };

  const subscriberId = adspId`urn:ads:platform:notification-service:v1:/subscribers/test`;
  const subscriber = {
    id: 'test',
    urn: subscriberId,
    userId: 'user',
    addressAs: 'Tester',
    channels: [
      {
        channel: Channel.email,
        address: 'tester@test.co',
      },
    ],
  };

  const form = new FormEntity(
    repositoryMock,
    new FormDefinitionEntity(tenantId, {
      id: 'my-test-form',
      name: 'My test form',
      description: null,
      anonymousApply: false,
      applicantRoles: [],
      assessorRoles: [],
      formDraftUrlTemplate: '',
    }),
    subscriber,
    {
      id: 'test-form',
      data: {},
      files: {
        test: adspId`urn:ads:platform:file-service:v1:/files/test`,
      },
      formDraftUrl: '',
      created: new Date(),
      createdBy: { id: 'tester', name: 'tester' },
      locked: null,
      submitted: null,
      lastAccessed: new Date(),
      status: FormStatus.Draft,
    }
  );

  beforeEach(() => {
    repositoryMock.find.mockReset();
    repositoryMock.delete.mockReset();
    notificationServiceMock.unsubscribe.mockReset();
    eventServiceMock.send.mockReset();
  });

  it('can create job', async () => {
    const job = createDeleteJob({
      logger: loggerMock,
      repository: repositoryMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      notificationService: notificationServiceMock,
    });

    expect(job).toBeTruthy();
  });

  it('can delete forms', async () => {
    const job = createDeleteJob({
      logger: loggerMock,
      repository: repositoryMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      notificationService: notificationServiceMock,
    });

    repositoryMock.find.mockResolvedValueOnce({ results: [form], page: { next: 'nextPage' } });
    repositoryMock.find.mockResolvedValueOnce({ results: [], page: {} });

    repositoryMock.delete.mockResolvedValueOnce({ deleted: true });

    await job();
    expect(repositoryMock.find).toHaveBeenCalledTimes(2);
    expect(notificationServiceMock.unsubscribe).toHaveBeenCalledTimes(1);
    expect(fileServiceMock.delete).toHaveBeenCalledTimes(1);
    expect(eventServiceMock.send).toHaveBeenCalledTimes(1);
  });

  it('can handle repository error', async () => {
    const job = createDeleteJob({
      logger: loggerMock,
      repository: repositoryMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      notificationService: notificationServiceMock,
    });

    repositoryMock.find.mockRejectedValueOnce(new Error('oh noes!'));

    await job();
    expect(repositoryMock.find).toHaveBeenCalledTimes(1);
  });

  it('can handle form delete error', async () => {
    const job = createDeleteJob({
      logger: loggerMock,
      repository: repositoryMock,
      eventService: eventServiceMock,
      fileService: fileServiceMock,
      notificationService: notificationServiceMock,
    });

    repositoryMock.find.mockResolvedValueOnce({ results: [form], page: { next: 'nextPage' } });
    repositoryMock.find.mockResolvedValueOnce({ results: [], page: {} });

    repositoryMock.delete.mockRejectedValueOnce(new Error('oh noes!'));

    await job();
    expect(repositoryMock.find).toHaveBeenCalledTimes(2);
  });
});
