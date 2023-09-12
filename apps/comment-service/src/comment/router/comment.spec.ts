import { UnauthorizedUserError, adspId } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { ServiceRoles } from '../roles';
import { TopicTypeEntity } from '../model';
import { createCommentRouter, getComments } from './comment';

describe('comment', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const repositoryMock = {
    getTopic: jest.fn(),
    getTopics: jest.fn(),
    getComment: jest.fn(),
    getComments: jest.fn(),
    save: jest.fn(),
    saveComment: jest.fn(),
    delete: jest.fn(),
    deleteComment: jest.fn(),
  };

  const user = { tenantId, id: 'tester', name: 'Tester', roles: [] };

  const type = new TopicTypeEntity(tenantId, {
    id: 'test',
    name: 'Test',
    adminRoles: ['test-admin'],
    commenterRoles: ['test-commenter'],
    readerRoles: ['test-reader'],
  });

  beforeEach(() => {
    repositoryMock.getComments.mockReset();
  });

  describe('createTopicRouter', () => {
    it('can create router', () => {
      const router = createCommentRouter({
        repository: repositoryMock,
      });
      expect(router).toBeTruthy();
    });
  });

  describe('getComments', () => {
    it('can create handler', () => {
      const handler = getComments(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get comments for admin', async () => {
      const req = {
        user: { ...user, roles: [ServiceRoles.Admin] },
        tenant: {
          id: tenantId,
        },
        query: {
          top: '12',
          after: 'abc-123',
          criteria: JSON.stringify({}),
        },
        getConfiguration: jest.fn(),
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = {};
      repositoryMock.getComments.mockResolvedValueOnce(result);

      const handler = getComments(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(result);
    });
  });

  it('can call next with unauthorized for non-admin', async () => {
    const req = {
      user: { ...user, roles: [] },
      tenant: {
        id: tenantId,
      },
      query: {
        top: '12',
        after: 'abc-123',
        criteria: JSON.stringify({}),
      },
      getConfiguration: jest.fn(),
    };
    const res = {
      send: jest.fn(),
    };
    const next = jest.fn();

    const handler = getComments(repositoryMock);
    await handler(req as unknown as Request, res as unknown as Response, next);
    expect(res.send).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
  });

  it('can get comments for type reader if type criteria specified', async () => {
    const req = {
      user: { ...user, roles: ['test-reader'] },
      tenant: {
        id: tenantId,
      },
      query: {
        top: '12',
        after: 'abc-123',
        criteria: JSON.stringify({ typeIdEquals: type.id }),
      },
      getConfiguration: jest.fn(),
    };
    const res = {
      send: jest.fn(),
    };
    const next = jest.fn();

    req.getConfiguration.mockResolvedValueOnce({ [type.id]: type });

    const result = {};
    repositoryMock.getComments.mockResolvedValueOnce(result);

    const handler = getComments(repositoryMock);
    await handler(req as unknown as Request, res as unknown as Response, next);
    expect(res.send).toHaveBeenCalledWith(result);
  });

  it('can call next with unauthorized for non-type reader if type criteria specified', async () => {
    const req = {
      user: { ...user, roles: [] },
      tenant: {
        id: tenantId,
      },
      query: {
        top: '12',
        after: 'abc-123',
        criteria: JSON.stringify({ typeIdEquals: type.id }),
      },
      getConfiguration: jest.fn(),
    };
    const res = {
      send: jest.fn(),
    };
    const next = jest.fn();

    req.getConfiguration.mockResolvedValueOnce({ [type.id]: type });

    const result = {};
    repositoryMock.getComments.mockResolvedValueOnce(result);

    const handler = getComments(repositoryMock);
    await handler(req as unknown as Request, res as unknown as Response, next);
    expect(res.send).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedUserError));
  });

  it('can call next with not found for if type criteria specifies missing type', async () => {
    const req = {
      user: { ...user, roles: [] },
      tenant: {
        id: tenantId,
      },
      query: {
        top: '12',
        after: 'abc-123',
        criteria: JSON.stringify({ typeIdEquals: 'another' }),
      },
      getConfiguration: jest.fn(),
    };
    const res = {
      send: jest.fn(),
    };
    const next = jest.fn();

    req.getConfiguration.mockResolvedValueOnce({ [type.id]: type });

    const result = {};
    repositoryMock.getComments.mockResolvedValueOnce(result);

    const handler = getComments(repositoryMock);
    await handler(req as unknown as Request, res as unknown as Response, next);
    expect(res.send).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
  });
});
