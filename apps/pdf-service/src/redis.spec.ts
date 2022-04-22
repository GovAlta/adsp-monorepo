import { adspId } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { RedisClient } from 'redis';
import { FileResult } from './pdf';
import { RedisJobRepository } from './redis';

describe('RedisJobRepository', () => {
  const tenantId = adspId`urn:ads:platform:tenant-service:v2:/tenants/test`;

  const redisClient = {
    get: jest.fn(),
    setex: jest.fn(),
  };
  const repository = new RedisJobRepository(redisClient as unknown as RedisClient);

  beforeEach(() => {
    redisClient.get.mockClear();
    redisClient.setex.mockClear();
  });

  describe('create', () => {
    it('can create job', async () => {
      redisClient.setex.mockImplementationOnce((_key, _timeout, _value, cb) => cb());
      const job = await repository.create(tenantId);
      expect(redisClient.setex).toHaveBeenCalledWith(
        expect.any(String),
        60 * 60 * 24,
        expect.any(String),
        expect.any(Function)
      );
      expect(job).toBeTruthy();
      expect(job.id).toBeTruthy();
      expect(job.status).toBe('queued');
    });
    it('can reject for redis err', async () => {
      redisClient.setex.mockImplementationOnce((_key, _timeout, _value, cb) => cb(new Error('no noes!')));
      await expect(repository.create(tenantId)).rejects.toThrow(Error);
    });
  });

  describe('get', () => {
    it('can get job', async () => {
      redisClient.get.mockImplementationOnce((_key, cb) =>
        cb(null, JSON.stringify({ tenantId: `${tenantId}`, id: 'job1', status: 'queued' }))
      );
      const job = await repository.get('job1');
      expect(redisClient.get).toHaveBeenCalledWith('job1', expect.any(Function));
      expect(job).toBeTruthy();
      expect(job.id).toBeTruthy();
      expect(job.status).toBe('queued');
    });

    it('can reject for redis err', async () => {
      redisClient.get.mockImplementationOnce((_key, cb) => cb(new Error('no nodes!')));
      await expect(repository.get('job1')).rejects.toThrow(Error);
    });
  });

  describe('update', () => {
    it('can update job', async () => {
      redisClient.get.mockImplementationOnce((_key, cb) =>
        cb(null, JSON.stringify({ tenantId: `${tenantId}`, id: 'job1', status: 'queued' }))
      );
      redisClient.setex.mockImplementationOnce((_key, _timeout, _value, cb) => cb());
      const job = await repository.update('job1', 'completed', {} as FileResult);
      expect(redisClient.setex).toHaveBeenCalledWith(
        'job1',
        60 * 60 * 24,
        JSON.stringify({ tenantId: `${tenantId}`, id: 'job1', status: 'completed', result: {} }),
        expect.any(Function)
      );
      expect(job).toBeTruthy();
      expect(job.id).toBeTruthy();
      expect(job.status).toBe('completed');
    });

    it('can reject for not found job', async () => {
      redisClient.get.mockImplementationOnce((_key, cb) => cb(null, null));
      await expect(() => repository.update('job1', 'completed', {} as FileResult)).rejects.toThrow(NotFoundError);
    });

    it('can reject for redis err', async () => {
      redisClient.get.mockImplementationOnce((_key, cb) =>
        cb(null, JSON.stringify({ tenantId: `${tenantId}`, id: 'job1', status: 'queued' }))
      );
      redisClient.setex.mockImplementationOnce((_key, _timeout, _value, cb) => cb(new Error('no noes!')));
      await expect(repository.update('job1', 'completed', {} as FileResult)).rejects.toThrow(Error);
    });
  });
});
