import { AdspId } from '@abgov/adsp-service-sdk';
import { createClient, RedisClient } from 'redis';
import { v4 as uuid } from 'uuid';
import { Logger } from 'winston';
import { FileResult, PdfJob, PdfJobRepository, PdfJobStatus } from './pdf';

const EXPIRY_SECONDS = 60 * 60 * 24;
export class RedisJobRepository implements PdfJobRepository {
  constructor(private readonly client: RedisClient) {}

  create(tenantId: AdspId): Promise<PdfJob> {
    const job: PdfJob = { id: uuid(), tenantId, status: 'queued' };
    return this.set(job.id, job);
  }

  get(jobId: string): Promise<PdfJob> {
    return new Promise<PdfJob>((resolve, reject) =>
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

  async update(jobId: string, status: PdfJobStatus, result?: FileResult): Promise<PdfJob> {
    const job = await this.get(jobId);

    return job ? this.set(jobId, { ...job, status, result }) : null;
  }

  private set(key: string, job: PdfJob): Promise<PdfJob> {
    return new Promise<PdfJob>((resolve, reject) => {
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

export function createJobRepository({ REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, logger }: RedisProps): {
  repository: PdfJobRepository;
  isConnected: () => boolean;
} {
  const credentials = REDIS_PASSWORD ? `:${REDIS_PASSWORD}@` : '';
  const client = createClient(`redis://${credentials}${REDIS_HOST}:${REDIS_PORT}/0`);
  client.on('error', (err) => {
    logger.error(`Redis client encountered error: ${err}`);
  });
  return { repository: new RedisJobRepository(client), isConnected: () => client.connected };
}
