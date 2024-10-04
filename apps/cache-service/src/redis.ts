import { RedisClient } from 'redis';
import { Logger } from 'winston';
import { CachedResponse, CacheProvider } from './cache';

class RedisCacheProvider implements CacheProvider {
  constructor(private logger: Logger, private client: RedisClient) {}

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

  async set(key: string, invalidateKey: string, ttl: number, value: CachedResponse): Promise<void> {
    const cached = this.toCachedValue(value);
    await new Promise((resolve, reject) => {
      let transaction = this.client.multi().sadd(invalidateKey, key);

      if (ttl > 0) {
        // Set the TTL if the value is greater than 0;
        transaction = transaction.setex(key, ttl, cached).expire(invalidateKey, ttl);
      } else {
        transaction = transaction.set(key, cached);
      }

      transaction.exec((err: unknown, result: [string, number, number]) => {
        if (err) {
          reject(err);
        } else {
          resolve(result);

          const [set, add, expire] = result;
          this.logger.debug(`Cache set with results for setex: ${set}, sadd: ${add}, and expire: ${expire}.`, {
            context: 'RedisCacheProvider',
          });
        }
      });
    });
  }

  async del(invalidateKey: string): Promise<boolean> {
    return await new Promise((resolve, reject) => {
      this.client.smembers(invalidateKey, (err, results) => {
        if (err) {
          reject(err);
        } else if (!results?.length) {
          resolve(false);
        } else {
          this.client
            .multi()
            .del(results)
            .srem(invalidateKey, results)
            .exec((err: unknown, results: [number, number]) => {
              if (err) {
                reject(err);
              } else {
                const [deleted, removed] = results;
                resolve(!!(deleted || removed));

                this.logger.debug(
                  `Cache invalidation deleted ${deleted} entries and removed ${removed} members from set.`,
                  {
                    context: 'RedisCacheProvider',
                  }
                );
              }
            });
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
  logger: Logger;
  client: RedisClient;
}

export function createRedisCacheProvider({ logger, client }: RedisCacheProviderProps): RedisCacheProvider {
  return new RedisCacheProvider(logger, client);
}
