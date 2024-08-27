import { adspId } from '@abgov/adsp-service-sdk';
import * as proxy from 'express-http-proxy';
import axios from 'axios';
import { Request, Response } from 'express';
import { Logger } from 'winston';
import { downloadFile, createGatewayRouter, findFile, submitSimpleForm } from './router';
import { NotFoundError } from '@core-services/core-common';

jest.mock('express-http-proxy');
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedProxy = proxy as jest.MockedFunction<typeof proxy>;

describe('router', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;
  const loggerMock = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  } as unknown as Logger;

  const tokenProviderMock = {
    getAccessToken: jest.fn(),
  };

  const tenantServiceMock = {
    getTenants: jest.fn(),
    getTenant: jest.fn(),
    getTenantByName: jest.fn(),
    getTenantByRealm: jest.fn(),
  };

  const formApiUrl = new URL('https://form-service/test/v1');
  const fileApiUrl = new URL('https://file-service/test/v1');

  beforeEach(() => {
    mockedAxios.post.mockReset();
    tokenProviderMock.getAccessToken.mockReset();
    tenantServiceMock.getTenantByName.mockReset();
  });

  it('can create router', () => {
    mockedProxy.mockImplementation(() => jest.fn((req, res, next) => next()));
    const router = createGatewayRouter({
      logger: loggerMock,
      tokenProvider: tokenProviderMock,
      tenantService: tenantServiceMock,
      fileApiUrl,
      formApiUrl,
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

      const handler = await downloadFile(fileApiUrl, tokenProviderMock);

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

      const handler = findFile(fileApiUrl, tokenProviderMock);
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

      const handler = downloadFile(fileApiUrl, tokenProviderMock);
      await handler(req as unknown as Request, res as unknown as Response, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('submitSimpleForm', () => {
    it('can create handler', () => {
      const handler = submitSimpleForm(loggerMock, formApiUrl, tokenProviderMock, tenantServiceMock);
      expect(handler).toBeTruthy();
    });

    it('can handle form submission request', async () => {
      const req = {
        body: {
          tenant: 'test',
          definitionId: 'test-form-definition',
          data: {},
          files: {},
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const formResult = { id: 'my-form' };

      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: tenantId });
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      mockedAxios.post.mockResolvedValueOnce({ data: formResult });

      const handler = submitSimpleForm(loggerMock, formApiUrl, tokenProviderMock, tenantServiceMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(formResult);
      expect(next).not.toHaveBeenCalled();

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://form-service/test/v1/forms',
        expect.objectContaining({
          definitionId: req.body.definitionId,
          data: req.body.data,
          files: req.body.files,
          submit: true,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );
    });

    it('can call next with not found for unknown tenant', async () => {
      const req = {
        body: {
          tenant: 'test',
          definitionId: 'test-form-definition',
          data: {},
          files: {},
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      tenantServiceMock.getTenantByName.mockResolvedValueOnce(null);

      const handler = submitSimpleForm(loggerMock, formApiUrl, tokenProviderMock, tenantServiceMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
    });

    it('can call next with error on failed request', async () => {
      const req = {
        body: {
          tenant: 'test',
          definitionId: 'test-form-definition',
          data: {},
          files: {},
        },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      tenantServiceMock.getTenantByName.mockResolvedValueOnce({ id: tenantId });
      tokenProviderMock.getAccessToken.mockResolvedValueOnce('token');
      mockedAxios.post.mockRejectedValueOnce(new Error('oh noes!'));

      const handler = submitSimpleForm(loggerMock, formApiUrl, tokenProviderMock, tenantServiceMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledWith(expect.any(Error));

      expect(mockedAxios.post).toHaveBeenCalledWith(
        'https://form-service/test/v1/forms',
        expect.objectContaining({
          definitionId: req.body.definitionId,
          data: req.body.data,
          files: req.body.files,
          submit: true,
        }),
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer token' }),
          params: expect.objectContaining({ tenantId: tenantId.toString() }),
        })
      );
    });
  });
});
