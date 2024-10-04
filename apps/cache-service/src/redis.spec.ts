import { RedisClient } from 'redis';
import { Logger } from 'winston';
import { createRedisCacheProvider } from './redis';
import { CachedResponse } from './cache';

describe('redis', () => {
  const logger = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as unknown as Logger;

  const client = {
    connected: true,
    get: jest.fn(),
    setex: jest.fn(),
    sadd: jest.fn(),
    smembers: jest.fn(),
    srem: jest.fn(),
    expire: jest.fn(),
    multi: jest.fn(() => client),
    del: jest.fn(),
    exec: jest.fn(),
  };

  beforeEach(() => {
    client.get.mockClear();
    client.multi.mockClear();
    client.setex.mockClear();
    client.sadd.mockClear();
    client.smembers.mockClear();
    client.srem.mockClear();
    client.del.mockClear();
    client.exec.mockClear();
  });

  describe('createRedisCacheProvider', () => {
    it('can create redis cache provider', () => {
      const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
      expect(provider).toBeTruthy();
    });
  });

  describe('RedisCacheProvider', () => {
    it('can get isConnected', () => {
      const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
      expect(provider.isConnected()).toBe(true);
    });

    describe('get', () => {
      it('can get from cache', async () => {
        const result = JSON.stringify({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          content: Buffer.from('This is some string content', 'utf-8').toString('base64'),
        });
        client.get.mockImplementationOnce((key, cb) => cb(null, result));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        const response = await provider.get('test');
        expect(response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.content.toString('utf-8')).toBe('This is some string content');
      });

      it('can get from cache with no content', async () => {
        const result = JSON.stringify({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
        client.get.mockImplementationOnce((_key, cb) => cb(null, result));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        const response = await provider.get('test');
        expect(response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.content).toBeFalsy();
      });

      it('can get from cache and handle no cache entry', async () => {
        client.get.mockImplementationOnce((_key, cb) => cb(null));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        const response = await provider.get('test');
        expect(response).toBeFalsy();
      });

      it('can get and throw error', async () => {
        const err = new Error('Oh noes!');
        client.get.mockImplementationOnce((_key, cb) => cb(err));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        await expect(provider.get('test')).rejects.toThrow(Error);
      });
    });

    describe('set', () => {
      it('can set to cache with no content', async () => {
        const response = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        };
        client.setex.mockImplementationOnce((_key, _ttl, _value) => client);
        client.sadd.mockImplementationOnce((_key, _member) => client);
        client.expire.mockImplementationOnce((_key, _ttl) => client);
        client.exec.mockImplementationOnce((cb) => cb(null, ['OK', 1, 1]));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        await provider.set('test', 'test-set', 300, response as unknown as CachedResponse);
        expect(client.setex).toHaveBeenCalledWith('test', 300, JSON.stringify({ ...response, content: undefined }));
        expect(client.exec).toHaveBeenCalledWith(expect.any(Function));
      });

      it('can set and throw error', async () => {
        const response = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          content: Buffer.from('This is some string content', 'utf-8'),
        };
        client.setex.mockImplementationOnce((_key, _ttl, _value) => client);
        client.sadd.mockImplementationOnce((_key, _member) => client);
        client.expire.mockImplementationOnce((_key, _ttl) => client);
        client.exec.mockImplementationOnce((cb) => cb(new Error('Oh noes!')));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        await expect(provider.set('test', 'test-set', 300, response)).rejects.toThrow(Error);
      });

      it('can set to cache with set key', async () => {
        const response = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          content: Buffer.from('This is some string content', 'utf-8'),
        };
        client.setex.mockImplementationOnce((_key, _ttl, _value) => client);
        client.sadd.mockImplementationOnce((_key, _member) => client);
        client.expire.mockImplementationOnce((_key, _ttl) => client);
        client.exec.mockImplementationOnce((cb) => cb(null, ['OK', 1, 1]));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        await provider.set('test', 'test-set', 300, response);
        expect(client.setex).toHaveBeenCalledWith(
          'test',
          300,
          JSON.stringify({ ...response, content: response.content.toString('base64') })
        );
        expect(client.sadd).toHaveBeenCalledWith('test-set', 'test');
        expect(client.exec).toHaveBeenCalledWith(expect.any(Function));
      });
    });

    describe('del', () => {
      it('can del to invalidate with set key', async () => {
        const set = ['test-1', 'test-2', 'test-3'];
        client.smembers.mockImplementationOnce((_key, cb) => cb(null, set));
        client.del.mockImplementationOnce((_key) => client);
        client.srem.mockImplementationOnce((_key, _members) => client);
        client.exec.mockImplementationOnce((cb) => cb(null, [set.length, set.length]));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        const result = await provider.del('test-set');
        expect(result).toBe(true);
        expect(client.smembers).toHaveBeenCalledWith('test-set', expect.any(Function));
        expect(client.del).toHaveBeenCalledWith(set);
        expect(client.srem).toHaveBeenCalledWith('test-set', set);
        expect(client.exec).toHaveBeenCalledWith(expect.any(Function));
      });

      it('can del to invalidate with set key and return false for empty set', async () => {
        const set = [];
        client.smembers.mockImplementationOnce((_key, cb) => cb(null, set));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        const result = await provider.del('test-set');
        expect(result).toBe(false);
        expect(client.smembers).toHaveBeenCalledWith('test-set', expect.any(Function));
      });

      it('can del with set key and throw error on smember error', async () => {
        client.smembers.mockImplementationOnce((_key, cb) => cb(new Error('Oh noes!')));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        await expect(provider.del('test-set')).rejects.toThrow(Error);
      });

      it('can del with set key and throw error on exec error', async () => {
        const set = ['test-1', 'test-2', 'test-3'];
        client.smembers.mockImplementationOnce((_key, cb) => cb(null, set));
        client.del.mockImplementationOnce((_key) => client);
        client.srem.mockImplementationOnce((_key, _members) => client);
        client.exec.mockImplementationOnce((cb) => cb(new Error('oh noes!')));

        const provider = createRedisCacheProvider({ logger, client: client as unknown as RedisClient });
        await expect(provider.del('test-set')).rejects.toThrow(Error);
      });
    });
  });
});
