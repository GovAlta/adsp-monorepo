import { Job } from 'node-schedule';
import { Logger } from 'winston';
import { ServiceStatusApplicationEntity } from '../model';
import { ServiceStatusRepository } from '../repository/serviceStatus';

interface FetchNonQueuedApplications {
  logger: Logger;
  scheduledJobs: Map<string, Job>;
  serviceStatusRepository: ServiceStatusRepository;
}

export async function fetchNonQueuedApplications({
  serviceStatusRepository,
  scheduledJobs,
}: FetchNonQueuedApplications): Promise<ServiceStatusApplicationEntity[]> {
  const scheduledIds: string[] = Object.keys(scheduledJobs);
  return serviceStatusRepository.findNonQueuedApplications(scheduledIds);
}

export async function fetchQueuedDisabledApplications({
  serviceStatusRepository,
  scheduledJobs,
}: FetchNonQueuedApplications): Promise<ServiceStatusApplicationEntity[]> {
  const scheduledIds: string[] = Object.keys(scheduledJobs);
  return serviceStatusRepository.findQueuedDisabledApplications(scheduledIds);
}

export async function fetchQueuedDeletedApplications({
  serviceStatusRepository,
  scheduledJobs,
}: FetchNonQueuedApplications): Promise<string[]> {
  const scheduledIds: string[] = Object.keys(scheduledJobs);
  return serviceStatusRepository.findQueuedDeletedApplicationIds(scheduledIds);
}
