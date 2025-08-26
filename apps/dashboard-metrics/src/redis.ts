import { createClient, RedisClient } from 'redis';
import { Duration } from 'luxon';
import { MetricsRepository } from './metrics';

export class RedisMetricsRepository implements MetricsRepository {
  constructor(private readonly client: RedisClient) {}

  isConnected(): boolean {
    return this.client.connected;
  }

  async writeMetrics(interval: string, metrics: Record<string, unknown>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.client.setex(
        interval,
        Duration.fromObject({ days: 10 }).as('seconds'),
        JSON.stringify(metrics),
        (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(!!result);
          }
        }
      );
    });
  }

  async readMetrics(interval: string): Promise<Record<string, unknown>> {
    return new Promise((resolve, reject) => {
      this.client.get(interval, (err, result) => {
        if (err) {
          reject(err);
        } else {
          resolve(JSON.parse(result || '{}'));
        }
      });
    });
  }
}

interface RedisProps {
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
}

export const createRedisRepository = ({ REDIS_HOST, REDIS_PORT, REDIS_PASSWORD }: RedisProps): MetricsRepository => {
  const credentials = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
  const client = createClient(`redis://${credentials}${REDIS_HOST}:${REDIS_PORT}/0`);
  return new RedisMetricsRepository(client);
};
