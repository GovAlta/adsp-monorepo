import * as proxy from 'express-http-proxy';
import axios from 'axios';

import { Logger } from 'winston';
import { createAddressRouter, findAddress, getValidToken, getAddressValidationToken } from './router';
import { Request, Response, NextFunction } from 'express';
jest.mock('express-http-proxy');
jest.mock('axios');

const axiosMock = axios as jest.Mocked<typeof axios>;

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedProxy = proxy as jest.MockedFunction<typeof proxy>;
const environment = {
  ADDRESS_TOKEN_CLIENT_ID: 'test-client-id',
  ADDRESS_TOKEN_CLIENT_SECRET: 'test-client-secret',
  ADDRESS_TOKEN_URL: 'http://mock-token-url',
  ADDRESS_URL: 'http://mock-address-url/',
};
const loggerMock = {
  info: jest.fn(),
  error: jest.fn(),
} as unknown as Logger;
describe('router', () => {
  const logger = {
    error: jest.fn(),
    info: jest.fn(),
  };

  beforeEach(() => {
    mockedAxios.post.mockReset();
    mockedAxios.get.mockReset();
  });

  it('can create router', () => {
    mockedProxy.mockImplementation(() => jest.fn((req, res, next) => next()));
    const router = createAddressRouter({
      environment,
      logger,
    });

    expect(router).toBeTruthy();
  });
});

describe('getAddressValidationToken', () => {
  it('should return token and expires_in on success', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'test-token', expires_in: 3600 } });

    const result = await getAddressValidationToken(
      'test-client-id',
      'test-client-secret',
      'http://mock-token-url',
      loggerMock
    );

    expect(result).toEqual({ token: 'test-token', expires_in: 3600 });
    expect(loggerMock.info).toHaveBeenCalledWith('Fetched address validation token', {
      expires_in: 3600,
    });
  });

  it('should throw an error if token request fails', async () => {
    axiosMock.post.mockRejectedValueOnce(new Error('Failed to obtain access token'));
    await expect(
      getAddressValidationToken('test-client-id', 'test-client-secret', 'http://mock-token-url', loggerMock)
    ).rejects.toThrow('Failed to obtain access token');
    expect(loggerMock.error).toHaveBeenCalledWith('Error fetching address validation token:', expect.any(String));
  });
});

describe('getValidToken', () => {
  beforeEach(() => {
    axiosMock.post.mockReset();
    axiosMock.get.mockReset();
  });
  it('should log and throw an error if token retrieval fails', async () => {
    await expect(getValidToken(environment, loggerMock)).rejects.toThrow('Error in token retrieval');
    expect(loggerMock.error).toHaveBeenCalledWith('Failed to obtain a valid token:', expect.any(String));
  });
  it('should fetch new token if no valid cache', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'new-token', expires_in: 3600 } });
    const token = await getValidToken(environment, loggerMock);

    expect(token).toBe('new-token');
    expect(axios.post).toHaveBeenCalledWith(
      'http://mock-token-url',
      expect.any(String),
      expect.objectContaining({
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
    );
    expect(loggerMock.info).toHaveBeenCalledWith('Fetched address validation token', { expires_in: 3600 });
  });
});
describe('findAddress', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  const nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {
      body: {
        country: 'CAN',
        languagePreference: 'en',
        maxSuggestions: '5',
        searchTerm: '7000 113 Street',
      },
      query: {
        lastId: 'CA|CP',
      },
    };

    mockResponse = {
      send: jest.fn(),
    };
    axiosMock.post.mockReset();
  });

  it('should fetch address suggestions and return the result', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'test-token', expires_in: 3600 } });

    axiosMock.get.mockResolvedValueOnce({
      data: [{ Id: '1', Text: '7000 113 Street', Highlight: '7000', Cursor: 0, Description: 'Edmonton, AB', Next: '' }],
    });

    const handler = findAddress({ environment, logger: loggerMock });
    await handler(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(mockResponse.send).toHaveBeenCalledWith([
      { Id: '1', Text: '7000 113 Street', Highlight: '7000', Cursor: 0, Description: 'Edmonton, AB', Next: '' },
    ]);

    expect(nextFunction).not.toHaveBeenCalled();
    expect(loggerMock.info).toHaveBeenCalledWith('Fetched address list for 7000 113 Street');
  });

  it('should log error and call next on failure', async () => {
    axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'test-token', expires_in: 3600 } });
    axiosMock.get.mockRejectedValueOnce(new Error('There was an error in the request to address validation API'));

    const handler = findAddress({ environment, logger: loggerMock });
    await handler(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(loggerMock.error).toHaveBeenCalledWith(
      'There was an error in the request to address validation API',
      expect.anything()
    );
    expect(nextFunction).toHaveBeenCalledWith(expect.anything());
  });
});
