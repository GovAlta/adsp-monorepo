import { RedisClient } from 'redis';
import { RedisCodeRepository } from './repository';

describe('RedisCodeRepository', () => {
  const clientMock = { get: jest.fn(), set: jest.fn(), expireat: jest.fn() };
  beforeEach(() => {
    clientMock.get.mockReset();
    clientMock.set.mockReset();
    clientMock.expireat.mockReset();
  });

  it('can be created', () => {
    const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
    expect(repository).toBeTruthy();
  });

  describe('get', () => {
    it('can return code', async () => {
      const key = 'test';
      const code = '123';

      clientMock.get.mockImplementationOnce((k, cb) => {
        expect(k).toBe(key);
        cb(null, code);
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      const result = await repository.get(key);
      expect(clientMock.get).toHaveBeenCalledTimes(1);
      expect(result.key).toBe(key);
      expect(result.code).toBe(code);
    });

    it('can return null for no cache value', async () => {
      const key = 'test';

      clientMock.get.mockImplementationOnce((k, cb) => {
        expect(k).toBe(key);
        cb(null, null);
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      const result = await repository.get(key);
      expect(clientMock.get).toHaveBeenCalledTimes(1);
      expect(result).toBeNull();
    });

    it('can reject on client error', async () => {
      const key = 'test';

      clientMock.get.mockImplementationOnce((k, cb) => {
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

      clientMock.set.mockImplementationOnce((k, c, cb) => {
        expect(k).toBe(key);
        expect(c).toBe(code);
        cb();
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      const result = await repository.set({ key, code }, expireAt);
      expect(clientMock.set).toHaveBeenCalledTimes(1);
      expect(clientMock.expireat).toHaveBeenCalledTimes(1);
      expect(clientMock.expireat).toHaveBeenCalledWith(key, Math.trunc(expireAt.getTime() / 1000));
      expect(result.key).toBe(key);
      expect(result.code).toBe(code);
    });

    it('can reject on client error', async () => {
      const key = 'test';
      const code = '123';
      const expireAt = new Date();

      clientMock.set.mockImplementationOnce((k, c, cb) => {
        cb(new Error('Something went terribly wrong.'));
      });

      const repository = new RedisCodeRepository((clientMock as unknown) as RedisClient);
      await expect(repository.set({ key, code }, expireAt)).rejects.toThrow();
    });
  });
});
