import axios from 'axios';
import { Request, Response } from 'express';
import { DirectoryRepository } from '../../directory/repository';
import { getNamespace } from './directory';

jest.mock('axios');
const axiosMock = axios as jest.Mocked<typeof axios>;
axiosMock.post.mockResolvedValueOnce({});

describe('directory', () => {
  const repositoryMock = {
    getDirectories: jest.fn(),
  };

  describe('getNamespace', () => {
    it('can create handler', () => {
      const handler = getNamespace(repositoryMock as unknown as DirectoryRepository);
      expect(handler).toBeTruthy();
    });

    it('can get namespace', async () => {
      const req = {
        params: { namespace: 'test-namespace' },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      const directory = {
        services: [],
      };
      repositoryMock.getDirectories.mockResolvedValueOnce(directory);

      const handler = getNamespace(repositoryMock as unknown as DirectoryRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([]));
    });

    it('can return empty for missing namespace', async () => {
      const req = {
        params: { namespace: 'test-namespace' },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getDirectories.mockResolvedValueOnce(null);

      const handler = getNamespace(repositoryMock as unknown as DirectoryRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).toHaveBeenCalledWith(expect.arrayContaining([]));
    });

    it('can handle err', async () => {
      const req = {
        params: { namespace: 'test-namespace' },
      };
      const res = {
        json: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getDirectories.mockRejectedValueOnce(new Error('oh noes!'));

      const handler = getNamespace(repositoryMock as unknown as DirectoryRepository);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.json).not.toHaveBeenCalled();
      expect(next).toBeCalledWith(expect.any(Error));
    });
  });
});
