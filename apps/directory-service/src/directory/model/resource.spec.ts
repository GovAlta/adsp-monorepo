import { AdspId, adspId } from '@abgov/adsp-service-sdk';
import { DomainEvent, InvalidOperationError } from '@core-services/core-common';
import axios from 'axios';
import { Logger } from 'winston';
import { ResourceType } from './resource';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;

describe('ResourceType', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const directoryMock = {
    getServiceUrl: jest.fn(),
    getResourceUrl: jest.fn(),
  };

  const repositoryMock = {
    find: jest.fn(),
    getDirectories: jest.fn(),
    exists: jest.fn(),
    update: jest.fn(),
    save: jest.fn(),
    getTags: jest.fn(),
    getTaggedResources: jest.fn(),
    applyTag: jest.fn(),
    removeTag: jest.fn(),
    deleteTag: jest.fn(),
    getResources: jest.fn(),
    saveResource: jest.fn(),
    deleteResource: jest.fn(),
  };

  beforeEach(() => {
    axiosMock.get.mockClear();
    axiosMock.isAxiosError.mockClear();
    directoryMock.getResourceUrl.mockClear();
    repositoryMock.deleteResource.mockClear();
    repositoryMock.saveResource.mockClear();
  });

  it('can be created', () => {
    const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
      type: 'test',
      matcher: '^\\/tests',
      namePath: 'testName',
      descriptionPath: 'testDescription',
    });

    expect(type).toBeTruthy();
  });

  describe('matches', () => {
    it('can match urn', () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      let result = type.matches(adspId`urn:ads:platform:test-service:v1:/tests/123`);
      expect(result).toBe(true);
      result = type.matches(adspId`urn:ads:platform:test-service:v1:/results/123`);
      expect(result).toBe(false);
    });

    it('can throw for non-resource URN', () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      expect(() => type.matches(adspId`urn:ads:platform:test-service`)).toThrowError();
    });
  });

  describe('resolve', () => {
    it('can resolve resource and sync', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      const resourceUrl = new URL('https://test-service.com/test/v1/tests/123');
      directoryMock.getResourceUrl.mockResolvedValueOnce(resourceUrl);

      const urn = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      const name = 'Test 123';
      const description = 'This is a description.';
      axiosMock.get.mockResolvedValueOnce({ data: { testName: name, testDescription: description } });
      repositoryMock.saveResource
        .mockImplementationOnce((resource) => Promise.resolve(resource))
        .mockImplementationOnce((resource) => Promise.resolve(resource));

      const result = await type.resolve('token', { tenantId, urn }, true);
      expect(result.tenantId).toBe(tenantId);
      expect(result.urn).toBe(urn);
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
      expect(repositoryMock.saveResource).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, urn, name, description, type: 'test' })
      );
    });

    it('can resolve resource and not sync', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      const resourceUrl = new URL('https://test-service.com/test/v1/tests/123');
      directoryMock.getResourceUrl.mockResolvedValueOnce(resourceUrl);

      const urn = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      const name = 'Test 123';
      const description = 'This is a description.';
      axiosMock.get.mockResolvedValueOnce({ data: { testName: name, testDescription: description } });
      repositoryMock.saveResource
        .mockImplementationOnce((resource) => Promise.resolve(resource))
        .mockImplementationOnce((resource) => Promise.resolve(resource));

      const result = await type.resolve('token', { tenantId, urn });
      expect(result.tenantId).toBe(tenantId);
      expect(result.urn).toBe(urn);
      expect(result.name).toBe(name);
      expect(result.description).toBe(description);
      expect(repositoryMock.saveResource).not.toHaveBeenCalled();
    });

    it('can default description getter', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
      });

      const resourceUrl = new URL('https://test-service.com/test/v1/tests/123');
      directoryMock.getResourceUrl.mockResolvedValueOnce(resourceUrl);

      const urn = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      const name = 'Test 123';
      const description = 'This is a description.';
      axiosMock.get.mockResolvedValueOnce({ data: { testName: name, testDescription: description } });
      repositoryMock.saveResource
        .mockImplementationOnce((resource) => Promise.resolve(resource))
        .mockImplementationOnce((resource) => Promise.resolve(resource));

      const result = await type.resolve('token', { tenantId, urn });
      expect(result.tenantId).toBe(tenantId);
      expect(result.urn).toBe(urn);
      expect(result.name).toBe(name);
      expect(result.description).toBe(undefined);
    });

    it('can throw on resolve error', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      const resourceUrl = new URL('https://test-service.com/test/v1/tests/123');
      directoryMock.getResourceUrl.mockResolvedValueOnce(resourceUrl);

      const urn = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      axiosMock.get.mockRejectedValueOnce(new Error('Oh noes!'));

      const resource = { tenantId, urn };
      await expect(type.resolve('token', resource)).resolves.toBe(resource);
    });

    it('can throw for resource not in directory', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      directoryMock.getResourceUrl.mockResolvedValueOnce(null);

      const urn = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      const resource = { tenantId, urn };
      await expect(type.resolve('token', resource)).resolves.toBe(resource);
    });

    it('can throw for not matched resource', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      await expect(
        type.resolve('token', { tenantId, urn: adspId`urn:ads:platform:test-service:v1:/results/123` })
      ).rejects.toThrow(InvalidOperationError);
    });

    it('can throw for null resource', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      await expect(type.resolve('token', null)).rejects.toThrow(Error);
    });

    it('can delete not found resource if sync true', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      const resourceUrl = new URL('https://test-service.com/test/v1/tests/123');
      directoryMock.getResourceUrl.mockResolvedValueOnce(resourceUrl);

      const urn = adspId`urn:ads:platform:test-service:v1:/tests/123`;

      const error = new Error('oh noes!');
      error['response'] = { status: 404 };
      axiosMock.get.mockRejectedValueOnce(error);
      axiosMock.isAxiosError.mockReturnValueOnce(true);

      repositoryMock.deleteResource.mockResolvedValueOnce(true);

      const result = await type.resolve('token', { tenantId, urn }, true);
      expect(result).toBeUndefined();
      expect(repositoryMock.deleteResource).toHaveBeenCalledWith(expect.objectContaining({ tenantId, urn }));
    });

    it('can not delete on not found resource if sync false', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
      });

      const resourceUrl = new URL('https://test-service.com/test/v1/tests/123');
      directoryMock.getResourceUrl.mockResolvedValueOnce(resourceUrl);

      const urn = adspId`urn:ads:platform:test-service:v1:/tests/123`;

      const error = new Error('oh noes!');
      error['response'] = { status: 404 };
      axiosMock.get.mockRejectedValueOnce(error);
      axiosMock.isAxiosError.mockReturnValueOnce(true);

      const resource = { tenantId, urn };
      const result = await type.resolve('token', resource);
      expect(result).toBe(resource);
      expect(repositoryMock.deleteResource).not.toHaveBeenCalled();
    });
  });

  describe('processDeleteEvent', () => {
    it('can delete resource on event', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
        deleteEvent: {
          namespace: 'test-service',
          name: 'test-started',
          resourceIdPath: 'test.id',
        },
      });

      const event = {
        namespace: 'test-service',
        name: 'test-started',
        tenantId,
        payload: {
          test: {
            id: 'urn:ads:platform:test-service:v1:/tests/123',
          },
        },
      };

      repositoryMock.deleteResource.mockResolvedValueOnce(true);
      const result = await type.processDeleteEvent(event as unknown as DomainEvent);
      expect(result.toString()).toBe(event.payload.test.id);
      expect(repositoryMock.deleteResource).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          urn: expect.any(AdspId),
        })
      );
    });

    it('can return null if no resource deleted', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
        deleteEvent: {
          namespace: 'test-service',
          name: 'test-started',
          resourceIdPath: 'test.id',
        },
      });

      const event = {
        namespace: 'test-service',
        name: 'test-started',
        tenantId,
        payload: {
          test: {
            id: 'urn:ads:platform:test-service:v1:/tests/123',
          },
        },
      };

      repositoryMock.deleteResource.mockResolvedValueOnce(false);
      const result = await type.processDeleteEvent(event as unknown as DomainEvent);
      expect(result).toBeNull();
      expect(repositoryMock.deleteResource).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId,
          urn: expect.any(AdspId),
        })
      );
    });

    it('can throw on null event', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
        deleteEvent: {
          namespace: 'test-service',
          name: 'test-started',
          resourceIdPath: 'test.id',
        },
      });

      await expect(type.processDeleteEvent(null)).rejects.toThrow(InvalidOperationError);
    });

    it('can throw on malformed event', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
        deleteEvent: {
          namespace: 'test-service',
          name: 'test-started',
          resourceIdPath: 'test.id',
        },
      });

      const event = {
        namespace: 'test-service',
        tenantId,
        payload: {
          test: {
            id: 'urn:ads:platform:test-service:v1:/tests/123',
          },
        },
      };

      await expect(type.processDeleteEvent(event as unknown as DomainEvent)).rejects.toThrow(InvalidOperationError);
    });

    it('can throw on no resource ID from event payload', async () => {
      const type = new ResourceType(loggerMock, directoryMock, repositoryMock, {
        type: 'test',
        matcher: '^\\/tests',
        namePath: 'testName',
        descriptionPath: 'testDescription',
        deleteEvent: {
          namespace: 'test-service',
          name: 'test-started',
          resourceIdPath: 'test.id',
        },
      });

      const event = {
        namespace: 'test-service',
        name: 'test-started',
        tenantId,
        payload: {
          testId: 'urn:ads:platform:test-service:v1:/tests/123',
        },
      };

      await expect(type.processDeleteEvent(event as unknown as DomainEvent)).rejects.toThrow(InvalidOperationError);
    });
  });
});
