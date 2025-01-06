import { AdspId, User } from '@abgov/adsp-service-sdk';
import { JobState, JobStatus } from './types';

export interface JobRepository<T> {
  create(user: User, tenantId: AdspId): Promise<JobState<T>>;
  get(jobId: string): Promise<JobState<T> | null>;
  update(jobId: string, status: JobStatus, result?: T): Promise<JobState<T> | null>;
}
