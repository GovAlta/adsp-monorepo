import { AdspId, adspId, UnauthorizedUserError } from '@abgov/adsp-service-sdk';
import { InvalidOperationError, NotFoundError } from '@core-services/core-common';
import { Logger } from 'winston';
import { Request, Response } from 'express';
import { ServiceRoles } from '../roles';
import {
  createResourceRouter,
  deleteResource,
  deleteTag,
  getResource,
  getResources,
  getResourceTags,
  getTag,
  getTaggedResources,
  getTags,
  tagOperation,
} from './resource';

describe('resource', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const apiId = adspId`urn:ads:platform:directory-service:resource-v1`;

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

  const eventServiceMock = {
    send: jest.fn(),
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
    eventServiceMock.send.mockClear();
    repositoryMock.getTags.mockClear();
    repositoryMock.getTaggedResources.mockClear();
    repositoryMock.applyTag.mockClear();
    repositoryMock.removeTag.mockClear();
    repositoryMock.deleteTag.mockClear();
    directoryMock.getResourceUrl.mockClear();
    repositoryMock.getResources.mockClear();
    repositoryMock.deleteResource.mockClear();
  });

  it('can create router', () => {
    const router = createResourceRouter({
      apiId,
      logger: loggerMock,
      directory: directoryMock,
      eventService: eventServiceMock,
      repository: repositoryMock,
    });
    expect(router).toBeTruthy();
  });

  describe('getTags', () => {
    it('can create handler', () => {
      const handler = getTags(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tags', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          label: 'Test label',
          value: 'test-label',
        },
      ];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = getTags(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining(results[0])]),
        })
      );
    });

    it('can get tags with query params', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        query: { top: '42', after: '123', resource: 'urn:ads:platform:file-service:v1:/files' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          label: 'Test label',
          value: 'test-label',
        },
      ];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = getTags(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        42,
        '123',
        expect.objectContaining({ tenantIdEquals: tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining(results[0])]),
        })
      );
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getTags(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getTag', () => {
    it('can create handler', () => {
      const handler = getTag(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tag', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { tag: 'test-label' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          label: 'Test label',
          value: 'test-label',
        },
      ];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = getTag(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        1,
        null,
        expect.objectContaining({ tenantIdEquals: tenantId, valueEquals: req.params.tag })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining(results[0]));
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        params: { tag: 'test-label' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getTag(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with not found', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { tag: 'test-label' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = getTag(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        1,
        null,
        expect.objectContaining({ tenantIdEquals: tenantId, valueEquals: req.params.tag })
      );
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('deleteTag', () => {
    it('can create handler', () => {
      const handler = deleteTag(apiId, repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete tag', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.DirectoryAdmin] },
        params: { tag: 'test-label' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          label: 'Test label',
          value: 'test-label',
        },
      ];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const deleted = true;
      repositoryMock.deleteTag.mockResolvedValueOnce(deleted);

      const handler = deleteTag(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        1,
        null,
        expect.objectContaining({ tenantIdEquals: tenantId, valueEquals: req.params.tag })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted }));
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        params: { tag: 'test-label' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = deleteTag(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can return false for not found', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.DirectoryAdmin] },
        params: { tag: 'test-label' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = deleteTag(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        1,
        null,
        expect.objectContaining({ tenantIdEquals: tenantId, valueEquals: req.params.tag })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: false }));
      expect(next).not.toHaveBeenCalledWith();
    });
  });

  describe('tagOperation', () => {
    it('can create handler', () => {
      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can tag resource', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            label: 'Test tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('http://file-service/file/v1/files/123'));

      const tag = {
        label: 'Test tag',
        value: 'test-tag',
      };
      const resource = {
        urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
      };
      repositoryMock.applyTag.mockResolvedValueOnce({ tag, resource, tagged: true });

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.applyTag).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, ...tag }),
        expect.objectContaining({ tenantId, urn: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          tagged: true,
          tag: expect.objectContaining(tag),
          resource: expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'tagged-resource',
        })
      );
    });

    it('can untag resource', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'untag-resource',
          tag: {
            label: 'Test tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('http://file-service/file/v1/files/123'));

      const tag = {
        label: 'Test tag',
        value: 'test-tag',
      };
      const resource = {
        urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
      };
      repositoryMock.removeTag.mockResolvedValueOnce({ tag, resource, untagged: true });

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.removeTag).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, ...tag }),
        expect.objectContaining({ tenantId, urn: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          untagged: true,
          tag: expect.objectContaining(tag),
          resource: expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'untagged-resource',
        })
      );
    });

    it('can tag resource with tag value', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('http://file-service/file/v1/files/123'));

      const tag = {
        label: 'Test tag',
        value: 'test-tag',
      };
      const resource = {
        urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
      };
      repositoryMock.applyTag.mockResolvedValueOnce({ tag, resource, tagged: true });

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.applyTag).toHaveBeenCalledWith(
        expect.objectContaining({ tenantId, ...req.body.tag }),
        expect.objectContaining({ tenantId, urn: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          tagged: true,
          tag: expect.objectContaining(tag),
          resource: expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
        })
      );
      expect(eventServiceMock.send).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'tagged-resource',
        })
      );
    });

    it('can call next with unauthorized user', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        body: {
          operation: 'other-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with invalid operation for unrecognized operation', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'other-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(new URL('http://file-service/file/v1/files/123'));

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for missing tag', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for tag without label and value', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {},
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for missing resource', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for resource with invalid urn', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: ':ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for resource with non-resource urn', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1:/files/123',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });

    it('can call next with invalid operation for resource not resolved by directory', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceTagger] },
        body: {
          operation: 'tag-resource',
          tag: {
            value: 'test-tag',
          },
          resource: {
            urn: 'urn:ads:platform:file-service:v1',
          },
        },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      directoryMock.getResourceUrl.mockResolvedValueOnce(null);

      const handler = tagOperation(apiId, loggerMock, directoryMock, eventServiceMock, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(res.send).not.toHaveBeenCalled();
      expect(eventServiceMock.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(InvalidOperationError));
    });
  });

  describe('getTaggedResources', () => {
    it('can create handler', () => {
      const handler = getTaggedResources(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tagged resources', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { tag: 'test-tag' },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      const page = {};
      repositoryMock.getTaggedResources.mockResolvedValueOnce({ results, page });

      const handler = getTaggedResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTaggedResources).toHaveBeenCalledWith(tenantId, 'test-tag', 10, undefined, null);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
          ]),
          page,
        })
      );
    });

    it('can get tagged resources with query params', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { tag: 'test-tag' },
        query: { top: '15', after: '123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      const page = {};
      repositoryMock.getTaggedResources.mockResolvedValueOnce({ results, page });

      const handler = getTaggedResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTaggedResources).toHaveBeenCalledWith(tenantId, 'test-tag', 15, '123', null);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
          ]),
          page,
        })
      );
    });

    it('can get tagged resources with criteria', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { tag: 'test-tag' },
        query: { top: '15', after: '123', criteria: JSON.stringify({ typeEquals: 'test' }) },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      const page = {};
      repositoryMock.getTaggedResources.mockResolvedValueOnce({ results, page });

      const handler = getTaggedResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTaggedResources).toHaveBeenCalledWith(
        tenantId,
        'test-tag',
        15,
        '123',
        expect.objectContaining({ typeEquals: 'test' })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({ urn: 'urn:ads:platform:file-service:v1:/files/123' }),
          ]),
          page,
        })
      );
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        params: { tag: 'test-tag' },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getTaggedResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can get tagged resources and include data', async () => {
      const req = {
        getServiceConfiguration: jest.fn(),
        tenant: { id: tenantId },
        user: {
          tenantId,
          id: 'tester',
          name: 'Tester',
          roles: [ServiceRoles.ResourceBrowser],
          token: { bearer: 'test' },
        },
        params: { tag: 'test-tag' },
        query: { includeRepresents: 'true' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      const page = {};
      repositoryMock.getTaggedResources.mockResolvedValueOnce({ results, page });

      const getResourceType = jest.fn();
      const type = {
        type: 'test',
        resolve: jest.fn(),
      };
      getResourceType.mockReturnValueOnce(type);
      const data = {};
      type.resolve.mockResolvedValueOnce({
        name: 'Test 123',
        description: 'This is test 123',
        data,
      });
      req.getServiceConfiguration.mockResolvedValueOnce({ getResourceType });

      const handler = getTaggedResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTaggedResources).toHaveBeenCalledWith(tenantId, 'test-tag', 10, undefined, null);
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          results: expect.arrayContaining([
            expect.objectContaining({
              urn: 'urn:ads:platform:file-service:v1:/files/123',
              _embedded: expect.objectContaining({ represents: data }),
            }),
          ]),
          page,
        })
      );
    });
  });

  describe('getResources', () => {
    it('can create handler', () => {
      const handler = getResources(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get resources', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      repositoryMock.getResources.mockResolvedValueOnce({ results, page });

      const handler = getResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getResources).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining({ urn: results[0].urn.toString() })]),
        })
      );
    });

    it('can get resources with query params', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        query: { top: '42', after: '123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      repositoryMock.getResources.mockResolvedValueOnce({ results, page });

      const handler = getResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getResources).toHaveBeenCalledWith(
        42,
        '123',
        expect.objectContaining({ tenantIdEquals: tenantId })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining({ urn: results[0].urn.toString() })]),
        })
      );
    });

    it('can get resources with criteria', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        query: { top: '42', after: '123', criteria: JSON.stringify({ typeEquals: 'test' }) },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      repositoryMock.getResources.mockResolvedValueOnce({ results, page });

      const handler = getResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getResources).toHaveBeenCalledWith(
        42,
        '123',
        expect.objectContaining({ tenantIdEquals: tenantId, typeEquals: 'test' })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining({ urn: results[0].urn.toString() })]),
        })
      );
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getResources(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });
  });

  describe('getResource', () => {
    it('can create handler', () => {
      const handler = getResource(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get resource', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      repositoryMock.getResources.mockResolvedValueOnce({ results, page });

      const handler = getResource(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getResources).toHaveBeenCalledWith(
        1,
        null,
        expect.objectContaining({ tenantIdEquals: tenantId, urnEquals: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ urn: results[0].urn.toString() }));
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getResource(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can call next with not found', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [];
      repositoryMock.getResources.mockResolvedValueOnce({ results, page });

      const handler = getResource(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getResources).toHaveBeenCalledWith(
        1,
        null,
        expect.objectContaining({ tenantIdEquals: tenantId, urnEquals: expect.any(AdspId) })
      );
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });

  describe('deleteResource', () => {
    it('can create handler', () => {
      const handler = deleteResource(apiId, repositoryMock, eventServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can delete resource', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.DirectoryAdmin] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          urn: adspId`urn:ads:platform:file-service:v1:/files/123`,
        },
      ];
      repositoryMock.getResources.mockResolvedValueOnce({ results, page });

      const deleted = true;
      repositoryMock.deleteResource.mockResolvedValueOnce(deleted);

      const handler = deleteResource(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getResources).toHaveBeenCalledWith(
        1,
        null,
        expect.objectContaining({ tenantIdEquals: tenantId, urnEquals: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted }));
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = deleteResource(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });

    it('can return false with not found', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.DirectoryAdmin] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [];
      repositoryMock.getResources.mockResolvedValueOnce({ results, page });

      const handler = deleteResource(apiId, repositoryMock, eventServiceMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getResources).toHaveBeenCalledWith(
        1,
        null,
        expect.objectContaining({ tenantIdEquals: tenantId, urnEquals: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(expect.objectContaining({ deleted: false }));
      expect(next).not.toHaveBeenCalledWith();
    });
  });

  describe('getResourceTags', () => {
    it('can create handler', () => {
      const handler = getResourceTags(apiId, repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get tags', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          label: 'Test label',
          value: 'test-label',
        },
      ];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = getResourceTags(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        10,
        undefined,
        expect.objectContaining({ tenantIdEquals: tenantId, resourceUrnEquals: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining(results[0])]),
        })
      );
    });

    it('can get tags with query params', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [ServiceRoles.ResourceBrowser] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
        query: { top: '42', after: '123' },
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const page = {};
      const results = [
        {
          label: 'Test label',
          value: 'test-label',
        },
      ];
      repositoryMock.getTags.mockResolvedValueOnce({ results, page });

      const handler = getResourceTags(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getTags).toHaveBeenCalledWith(
        42,
        '123',
        expect.objectContaining({ tenantIdEquals: tenantId, resourceUrnEquals: expect.any(AdspId) })
      );
      expect(res.send).toHaveBeenCalledWith(
        expect.objectContaining({
          page,
          results: expect.arrayContaining([expect.objectContaining(results[0])]),
        })
      );
    });

    it('can call next with unauthorized', async () => {
      const req = {
        tenant: { id: tenantId },
        user: { tenantId, id: 'tester', name: 'Tester', roles: [] },
        params: { resource: 'urn:ads:platform:file-service:v1:/files/123' },
        query: {},
      };
      const res = { send: jest.fn() };
      const next = jest.fn();

      const handler = getResourceTags(apiId, repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(UnauthorizedUserError));
    });
  });
});
