import { RedisClient } from 'redis';
import { CachedResponse, CacheProvider } from './cache';

class RedisCacheProvider implements CacheProvider {
  constructor(private client: RedisClient) {}

  isConnected(): boolean {
    return this.client.connected;
  }

  async get(key: string): Promise<CachedResponse> {
    const cached = await new Promise<string>((resolve, reject) =>
      this.client.get(key, function (err, cached) {
        if (err) {
          reject(err);
        } else {
          resolve(cached);
        }
      })
    );

    return this.fromCachedValue(cached);
  }

  async set(key: string, ttl: number, value: CachedResponse) {
    const cached = this.toCachedValue(value);
    await new Promise((resolve, reject) => {
      this.client.setex(key, ttl, cached, function (err, result) {
        if (err) {
          reject(err);
        } else {
          resolve(result);
        }
      });
    });
  }

  private toCachedValue({ content, ...value }: CachedResponse): string {
    return JSON.stringify({
      ...value,
      content: content?.toString('base64'),
    });
  }

  private fromCachedValue(cached: string): CachedResponse {
    if (cached) {
      const { content, ...value } = JSON.parse(cached);

      return {
        ...value,
        content: content ? Buffer.from(content, 'base64') : null,
      };
    } else {
      return null;
    }
  }
}

interface RedisCacheProviderProps {
  client: RedisClient;
}

export function createRedisCacheProvider({ client }: RedisCacheProviderProps): RedisCacheProvider {
  return new RedisCacheProvider(client);
}
