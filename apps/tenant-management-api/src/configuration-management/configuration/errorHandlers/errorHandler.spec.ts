import * as HttpStatusCodes from 'http-status-codes';
import { errorHandler } from '../errorHandlers';
import { Request } from 'express';
import HttpException from './httpException';

describe('http exception handler tests', () => {
  it('return internal 500 when no status code present', () => {
    let responseObject = {};
    const request = {};
    const response = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
      }),
      send: jest.fn(),
      status: jest.fn(() => response),
    };

    const expectedMessage =
      `It's not you. It's us. We are having some problems.`;
    const exception = new HttpException(null, '');

    const expectedResponse = {
      error: {
        message: expectedMessage,
      },
    };

    errorHandler(exception as HttpException, request as Request, response);

    expect(response.statusCode == HttpStatusCodes.INTERNAL_SERVER_ERROR);
    expect(responseObject).toEqual(expectedResponse);
  });

  it('return not found 404 with formatted json error', () => {
    let responseObject = {};
    const request = {};
    const response = {
      json: jest.fn().mockImplementation((result) => {
        responseObject = result;
      }),
      send: jest.fn(),
      status: jest.fn(() => response),
    };

    const expectedMessage = 'Not found';
    const exception = new HttpException(404, 'Not found');

    const expectedResponse = {
      error: {
        message: expectedMessage,
      },
    };

    errorHandler(exception as HttpException, request as Request, response);

    expect(response.statusCode == HttpStatusCodes.NOT_FOUND);
    expect(responseObject).toEqual(expectedResponse);
  });
});
