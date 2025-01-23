import { adspId } from '@abgov/adsp-service-sdk';
import { DomainEvent } from '@core-services/core-common';
import { Logger } from 'winston';
import { ResourceType } from '../model';
import { DirectoryConfiguration } from './configuration';

describe('configuration', () => {
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
    saveResource: jest.fn(),
    deleteResource: jest.fn(),
  };

  it('can be created', () => {
    const configuration = new DirectoryConfiguration(
      {
        logger: loggerMock,
        directory: directoryMock,
        repository: repositoryMock,
      },
      {},
      {},
      tenantId
    );

    expect(configuration).toBeTruthy();
  });

  describe('getResourceType', () => {
    it('can get type for API resources', () => {
      const resourceId = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      const configuration = new DirectoryConfiguration(
        {
          logger: loggerMock,
          directory: directoryMock,
          repository: repositoryMock,
        },
        {},
        {
          'urn:ads:platform:test-service:v1': {
            resourceTypes: [
              {
                type: 'test',
                matcher: '^\\/tests\\/123',
                namePath: 'testName',
              },
            ],
          },
        },
        tenantId
      );

      const type = configuration.getResourceType(resourceId);
      expect(type).toEqual(expect.any(ResourceType));
      expect(type).toEqual(expect.objectContaining({ type: 'test' }));
    });

    it('can get type for API resources from tenant configuration', () => {
      const resourceId = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      const configuration = new DirectoryConfiguration(
        {
          logger: loggerMock,
          directory: directoryMock,
          repository: repositoryMock,
        },
        {
          'urn:ads:platform:test-service:v1': {
            resourceTypes: [
              {
                type: 'test',
                matcher: '^\\/tests\\/123',
                namePath: 'testName',
              },
            ],
          },
        },
        {},
        tenantId
      );

      const type = configuration.getResourceType(resourceId);
      expect(type).toEqual(expect.any(ResourceType));
      expect(type).toEqual(expect.objectContaining({ type: 'test' }));
    });

    it('can core to take precedence over tenant', () => {
      const resourceId = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      const configuration = new DirectoryConfiguration(
        {
          logger: loggerMock,
          directory: directoryMock,
          repository: repositoryMock,
        },
        {
          'urn:ads:platform:test-service:v1': {
            resourceTypes: [
              {
                type: 'not-test',
                matcher: '^\\/tests\\/123',
                namePath: 'testName',
              },
            ],
          },
        },
        {
          'urn:ads:platform:test-service:v1': {
            resourceTypes: [
              {
                type: 'test',
                matcher: '^\\/tests\\/123',
                namePath: 'testName',
              },
            ],
          },
        },
        tenantId
      );

      const type = configuration.getResourceType(resourceId);
      expect(type).toEqual(expect.any(ResourceType));
      expect(type).toEqual(expect.objectContaining({ type: 'test' }));
    });

    it('can handle malformed resource type configuration', () => {
      const resourceId = adspId`urn:ads:platform:test-service:v1:/tests/123`;
      const configuration = new DirectoryConfiguration(
        {
          logger: loggerMock,
          directory: directoryMock,
          repository: repositoryMock,
        },
        {},
        {
          'urn:ads:platform:test-service:v2': {
            resourceTypes: [
              {
                type: 'test',
                matcher: '*', // Not valid regex
                namePath: 'testName',
              },
            ],
          },
          'urn:ads:platform:test-service:v1': {
            resourceTypes: [
              {
                type: 'test',
                matcher: '^\\/tests\\/123',
                namePath: 'testName',
              },
            ],
          },
        },
        tenantId
      );

      const type = configuration.getResourceType(resourceId);
      expect(type).toEqual(expect.any(ResourceType));
      expect(type).toEqual(expect.objectContaining({ type: 'test' }));
    });
  });

  describe('getResourceTypeForDeleteEvent', () => {
    it('can get type for delete event', () => {
      const configuration = new DirectoryConfiguration(
        {
          logger: loggerMock,
          directory: directoryMock,
          repository: repositoryMock,
        },
        {},
        {
          'urn:ads:platform:test-service:v1': {
            resourceTypes: [
              {
                type: 'test',
                matcher: '^\\/tests\\/123',
                namePath: 'testName',
                deleteEvent: {
                  namespace: 'test-service',
                  name: 'test-started',
                  resourceIdPath: 'test.id',
                },
              },
            ],
          },
        },
        tenantId
      );

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

      const type = configuration.getResourceTypeForDeleteEvent(event as unknown as DomainEvent);
      expect(type).toEqual(expect.any(ResourceType));
      expect(type).toEqual(expect.objectContaining({ type: 'test' }));
    });

    it('can return undefined for no resource type matched to event', () => {
      const configuration = new DirectoryConfiguration(
        {
          logger: loggerMock,
          directory: directoryMock,
          repository: repositoryMock,
        },
        {},
        {
          'urn:ads:platform:test-service:v1': {
            resourceTypes: [
              {
                type: 'test',
                matcher: '^\\/tests\\/123',
                namePath: 'testName',
              },
            ],
          },
        },
        tenantId
      );

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

      const type = configuration.getResourceTypeForDeleteEvent(event as unknown as DomainEvent);
      expect(type).toBeUndefined();
    });
  });
});
