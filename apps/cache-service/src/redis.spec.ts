import { RedisClient } from 'redis';
import { createRedisCacheProvider } from './redis';
import { CachedResponse } from './cache';

describe('redis', () => {
  const client = {
    connected: true,
    get: jest.fn(),
    setex: jest.fn(),
  };

  beforeEach(() => {
    client.get.mockReset();
    client.setex.mockReset();
  });

  describe('createRedisCacheProvider', () => {
    it('can create redis cache provider', () => {
      const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
      expect(provider).toBeTruthy();
    });
  });

  describe('RedisCacheProvider', () => {
    it('can get isConnected', () => {
      const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
      expect(provider.isConnected()).toBe(true);
    });

    describe('get', () => {
      it('can get from cache', async () => {
        const result = JSON.stringify({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          content: Buffer.from('This is some string content', 'utf-8').toString('base64'),
        });
        client.get.mockImplementation((key, cb) => cb(null, result));

        const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
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
        client.get.mockImplementation((key, cb) => cb(null, result));

        const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
        const response = await provider.get('test');
        expect(response).toBeTruthy();
        expect(response.status).toBe(200);
        expect(response.content).toBeFalsy();
      });

      it('can get from cache and handle no cache entry', async () => {
        client.get.mockImplementation((key, cb) => cb(null));

        const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
        const response = await provider.get('test');
        expect(response).toBeFalsy();
      });

      it('can get and throw error', async () => {
        const err = new Error('Oh noes!');
        client.get.mockImplementation((_key, cb) => cb(err));

        const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
        await expect(provider.get('test')).rejects.toThrow(Error);
      });
    });

    describe('set', () => {
      it('can set to cache', async () => {
        const response = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          content: Buffer.from('This is some string content', 'utf-8'),
        };
        client.setex.mockImplementation((_key, _ttl, _value, cb) => cb(null, 'success'));

        const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
        await provider.set('test', 300, response);
        expect(client.setex).toHaveBeenCalledWith(
          'test',
          300,
          JSON.stringify({ ...response, content: response.content.toString('base64') }),
          expect.any(Function)
        );
      });

      it('can set to cache with no content', async () => {
        const response = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        };
        client.setex.mockImplementation((_key, _ttl, _value, cb) => cb(null, 'success'));

        const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
        await provider.set('test', 300, response as unknown as CachedResponse);
        expect(client.setex).toHaveBeenCalledWith(
          'test',
          300,
          JSON.stringify({ ...response, content: undefined }),
          expect.any(Function)
        );
      });

      it('can set and throw error', async () => {
        const response = {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          content: Buffer.from('This is some string content', 'utf-8'),
        };
        client.setex.mockImplementation((_key, _ttl, _value, cb) => cb(new Error('Oh noes!')));

        const provider = createRedisCacheProvider({ client: client as unknown as RedisClient });
        await expect(provider.set('test', 300, response)).rejects.toThrow(Error);
      });
    });
  });
});
