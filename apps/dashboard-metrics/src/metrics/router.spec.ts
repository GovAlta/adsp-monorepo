import { Request, Response } from 'express';
import { DateTime } from 'luxon';
import { createMetricsRouter, getMetricsResource } from './router';
import { MetricsRepository } from './repository';

describe('metrics router', () => {
  let repository: jest.Mocked<MetricsRepository>;

  beforeEach(() => {
    repository = {
      isConnected: jest.fn(),
      writeMetrics: jest.fn(),
      readMetrics: jest.fn(),
    };
  });

  it('can create router', () => {
    const router = createMetricsRouter({ repository });
    expect(router).toBeTruthy();
  });

  describe('getMetricsResource', () => {
    it('should return metrics for a valid interval', async () => {
      const fakeMetrics = { data: [1, 2, 3] };
      repository.readMetrics.mockResolvedValue(fakeMetrics);

      const handler = getMetricsResource(repository);

      const interval = DateTime.now().toUTC().toISO();
      const res = { json: jest.fn() } as unknown as Response;
      const next = jest.fn();
      await handler({ params: { interval } } as unknown as Request, res, next);

      expect(res.json).toHaveBeenCalledWith(fakeMetrics);
      expect(next).not.toHaveBeenCalled();
      expect(repository.readMetrics).toHaveBeenCalledWith(interval);
    });

    it('should handle repository errors', async () => {
      repository.readMetrics.mockRejectedValue(new Error('DB error'));

      const handler = getMetricsResource(repository);

      const interval = DateTime.now().toUTC().toISO();
      const res = { json: jest.fn() } as unknown as Response;
      const next = jest.fn();
      await handler({ params: { interval } } as unknown as Request, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});
