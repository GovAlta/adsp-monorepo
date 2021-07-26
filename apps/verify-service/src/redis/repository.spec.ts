import { RedisClient } from 'redis';
import { RedisCodeRepository } from './repository';

describe('RedisCodeRepository', () => {
  const clientMock = { hmget: jest.fn(), hset: jest.fn(), expireat: jest.fn(), hincrby: jest.fn(), del: jest.fn() };
  beforeEach(() => {
    clientMock.hmget.mockReset();
    clientMock.hset.mockReset();
    clientMock.expireat.mockReset();
    clientMock.hincrby.mockReset();
    clientMock.del.mockReset();
  });

  it('can be created', () => {
    const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
    expect(repository).toBeTruthy();
  });

  describe('get', () => {
    it('can return code', async () => {
      const key = 'test';
      const code = '123';

      clientMock.hmget.mockImplementationOnce((k, _c, _f, cb) => {
        expect(k).toBe(key);
        cb(null, [code, 0]);
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      const result = await repository.get(key);
      expect(clientMock.hmget).toHaveBeenCalledTimes(1);
      expect(result.key).toBe(key);
      expect(result.code).toBe(code);
    });

    it('can return null for no cache value', async () => {
      const key = 'test';

      clientMock.hmget.mockImplementationOnce((k, _c, _f, cb) => {
        expect(k).toBe(key);
        cb(null, null);
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      const result = await repository.get(key);
      expect(clientMock.hmget).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('can reject on client error', async () => {
      const key = 'test';

      clientMock.hmget.mockImplementationOnce((_k, _c, _f, cb) => {
        cb(new Error('Something went terribly wrong.'));
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      await expect(repository.get(key)).rejects.toThrow();
    });
  });

  describe('set', () => {
    it('can set code', async () => {
      const key = 'test';
      const code = '123';
      const expireAt = new Date();

      clientMock.hset.mockImplementationOnce((k, _c, c, _f, f, cb) => {
        expect(k).toBe(key);
        expect(c).toBe(code);
        expect(f).toBe('0');
        cb();
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      const result = await repository.set({ key, code }, expireAt);
      expect(clientMock.hset).toHaveBeenCalledTimes(1);
      expect(clientMock.expireat).toHaveBeenCalledTimes(1);
      expect(clientMock.expireat).toHaveBeenCalledWith(key, Math.trunc(expireAt.getTime() / 1000));
      expect(result.key).toBe(key);
      expect(result.code).toBe(code);
    });

    it('can reject on client error', async () => {
      const key = 'test';
      const code = '123';
      const expireAt = new Date();

      clientMock.hset.mockImplementationOnce((_k, _cn, _c, _fn, _f, cb) => {
        cb(new Error('Something went terribly wrong.'));
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      await expect(repository.set({ key, code }, expireAt)).rejects.toThrow();
    });
  });

  describe('failed', () => {
    it('can increment failure', async () => {
      const key = 'test';

      clientMock.hincrby.mockImplementationOnce((k, f, n, cb) => {
        expect(k).toBe(key);
        expect(f).toBe('failures');
        expect(n).toBe(1);
        cb(null, 1);
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      const deleted = await repository.failed(key, 5);
      expect(clientMock.hincrby).toHaveBeenCalledTimes(1);
      expect(clientMock.del).toHaveBeenCalledTimes(0);
      expect(deleted).toBe(false);
    });

    it('can delete on max failures', async () => {
      const key = 'test';

      clientMock.hincrby.mockImplementationOnce((k, f, n, cb) => {
        expect(k).toBe(key);
        expect(f).toBe('failures');
        expect(n).toBe(1);
        cb(null, 1);
      });

      clientMock.del.mockImplementationOnce((k, cb) => {
        expect(k).toBe(key);
        cb(null, 1);
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      const deleted = await repository.failed(key, 1);
      expect(clientMock.hincrby).toHaveBeenCalledTimes(1);
      expect(clientMock.del).toHaveBeenCalledTimes(1);
      expect(deleted).toBe(true);
    });
  });
});
