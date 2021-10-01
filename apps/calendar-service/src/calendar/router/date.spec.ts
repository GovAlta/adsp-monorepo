import { NotFoundError } from '@core-services/core-common';
import { Request, Response } from 'express';
import { createDateRouter, getDate, getDates } from './date';

describe('date router', () => {
  const repositoryMock = {
    getDate: jest.fn(),
    getDates: jest.fn(),
    getCalendarEvents: jest.fn(),
    getCalendarEvent: jest.fn(),
    getEventAttendees: jest.fn(),
    save: jest.fn(),
    saveAttendee: jest.fn(),
    delete: jest.fn(),
    deleteAttendee: jest.fn(),
  };

  beforeEach(() => {
    repositoryMock.getDate.mockReset();
    repositoryMock.getDates.mockReset();
  });

  it('can create router', () => {
    const router = createDateRouter({ repository: repositoryMock });
    expect(router).toBeTruthy();
  });

  describe('getDates', () => {
    it('can create handler', () => {
      const handler = getDates(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get dates', async () => {
      const req = { query: {} };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getDates.mockResolvedValue(result);

      const handler = getDates(repositoryMock);
      await handler(req as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(result);
    });

    it('can get dates with query params', async () => {
      const req = {
        query: { top: '11', after: '123' },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getDates.mockResolvedValue(result);

      const handler = getDates(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getDates).toHaveBeenCalledWith(11, '123', null);
      expect(res.send).toHaveBeenCalledWith(result);
    });

    it('can get dates with query criteria param', async () => {
      const req = {
        query: { criteria: JSON.stringify({ min: 20210111 }) },
      };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = { results: [], page: {} };
      repositoryMock.getDates.mockResolvedValue(result);

      const handler = getDates(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(repositoryMock.getDates).toHaveBeenCalledWith(10, undefined, expect.objectContaining({ min: 20210111 }));
      expect(res.send).toHaveBeenCalledWith(result);
    });
  });

  describe('getDate', () => {
    it('can create handler', () => {
      const handler = getDate(repositoryMock);
      expect(handler).toBeTruthy();
    });

    it('can get date', async () => {
      const req = { params: { id: '20210111' } };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      const result = {};
      repositoryMock.getDate.mockResolvedValue(result);

      const handler = getDate(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(res.send).toHaveBeenCalledWith(result);
    });

    it('can call next with not found', async () => {
      const req = { params: { id: '20210111' } };
      const res = {
        send: jest.fn(),
      };
      const next = jest.fn();

      repositoryMock.getDate.mockResolvedValue(null);

      const handler = getDate(repositoryMock);
      await handler(req as unknown as Request, res as unknown as Response, next);
      expect(next).toHaveBeenCalledWith(expect.any(NotFoundError));
      expect(res.send).not.toHaveBeenCalled();
    });
  });
});
