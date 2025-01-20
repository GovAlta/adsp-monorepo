import { AdspId, User } from '@abgov/adsp-service-sdk';
import { createClient, RedisClient } from 'redis';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import { JobRepository, JobState, JobStatus } from './job';

const EXPIRY_SECONDS = 60 * 60 * 24;
export class RedisJobRepository<T> implements JobRepository<T> {
  constructor(private readonly client: RedisClient) {}

  create(user: User, tenantId: AdspId): Promise<JobState<T>> {
    const job: JobState<T> = { id: uuid(), tenantId, createdBy: { id: user.id, name: user.name }, status: 'queued' };
    return this.set(job.id, job);
  }

  get(jobId: string): Promise<JobState<T> | null> {
    return new Promise<JobState<T> | null>((resolve, reject) =>
      this.client.get(jobId, (err, result) => {
        if (err) {
          reject(err);
        } else if (result) {
          const job = JSON.parse(result);
          resolve({ ...job, tenantId: AdspId.parse(job.tenantId) });
        } else {
          resolve(null);
        }
      })
    );
  }

  async update(jobId: string, status: JobStatus, result?: T): Promise<JobState<T> | null> {
    const job = await this.get(jobId);

    return job ? this.set(jobId, { ...job, status, result }) : null;
  }

  private set(key: string, job: JobState<T>): Promise<JobState<T>> {
    return new Promise<JobState<T>>((resolve, reject) => {
      this.client.setex(key, EXPIRY_SECONDS, JSON.stringify({ ...job, tenantId: `${job.tenantId}` }), (err) =>
        err ? reject(err) : resolve(job)
      );
    });
  }
}

interface RedisProps {
  logger: Logger;
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD: string;
}

export function createJobRepository<T>({ REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, logger }: RedisProps): {
  repository: JobRepository<T>;
  isConnected: () => boolean;
} {
  const credentials = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
  const client = createClient(`redis://${credentials}${REDIS_HOST}:${REDIS_PORT}/0`);
  client.on('error', (err) => {
    logger.error(`Redis client encountered error: ${err}`);
  });
  return { repository: new RedisJobRepository<T>(client), isConnected: () => client.connected };
}
