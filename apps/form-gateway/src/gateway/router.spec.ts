//import * as proxy from 'express-http-proxy';
import * as proxy from 'express-http-proxy';
import { adspId } from '@abgov/adsp-service-sdk';
import axios from 'axios';

jest.mock('express-http-proxy');
import { Request, Response } from 'express';
import { Logger } from 'winston';

import { downloadFile, createGatewayRouter, findFile } from './router';

jest.mock('axios');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedProxy = proxy as jest.MockedFunction<typeof proxy>;

describe('file router', () => {
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(() => Promise.resolve('token')),
  };

  const configurationApiUrl = new URL('https://configuration-service/test/v1');
  const fileUrl = new URL('https://file-service/test/v1');

  it('can create router', () => {
    mockedProxy.mockImplementation(() => jest.fn((req, res, next) => next()));
    const router = createGatewayRouter({
      logger: loggerMock,
      tokenProvider: tokenProviderMock,
      configurationApiUrl: configurationApiUrl,
      fileUrl: fileUrl,
    });

    expect(router).toBeTruthy();
  });

  describe('downloadFile', () => {
    it('should download file successfully', async () => {
      const req = {
        query: {},
        tenant: { id: 'test-tenant-id' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const next = jest.fn();

      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ id: 'test-file-id' }],
        },
      });

      mockedProxy.mockImplementation(() => jest.fn((req, res, next) => next()));

      const handler = await downloadFile(fileUrl, tokenProviderMock);

      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(tokenProviderMock.getAccessToken).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('can find files', async () => {
      const req = {
        query: {},
        tenant: { id: 'test-tenant-id' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const next = jest.fn();

      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ id: 'test-file-id' }],
        },
      });

      mockedAxios.get.mockResolvedValue({
        data: {
          results: [{ id: 'test-file-id' }],
        },
      });

      const handler = findFile(fileUrl, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(tokenProviderMock.getAccessToken).toHaveBeenCalled();
      expect(mockedAxios.get).toHaveBeenCalled();
      expect(res.send).toHaveBeenCalledWith({ fileId: 'test-file-id' });
    });

    it('should handle errors', async () => {
      const req = {
        query: {},
        tenant: { id: 'test-tenant-id' },
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
      };
      const next = jest.fn();
      const error = new Error('test error');
      tokenProviderMock.getAccessToken.mockRejectedValue(error);

      const handler = downloadFile(fileUrl, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
