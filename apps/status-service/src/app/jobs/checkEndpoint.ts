import { Logger } from 'winston';

import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntry, EndpointStatusType, EndpointToInternalStatusMapping } from '../types';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { EventService } from '@abgov/adsp-service-sdk';
import { applicationStatusToHealthy, applicationStatusToUnhealthy } from '../events';
import { HealthCheckJobs } from './healthCheckJobs';

const ENTRY_SAMPLE_SIZE = 5;
const MIN_PASS_COUNT = 3;

type Getter = (url: string) => Promise<{ status: number | string }>;
export interface CreateCheckEndpointProps {
  logger?: Logger;
  url: string;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  eventService: EventService;
  getter: Getter;
}

export function createCheckEndpointJob(props: CreateCheckEndpointProps) {
  return async (): Promise<void> => {
    const { getter } = props;
    // run all endpoint tests
    const statusEntry = await doRequest(getter, props.url, props.logger);
    await doSave(props, statusEntry);
  };
}

async function doRequest(getter: Getter, url: string, logger: Logger): Promise<EndpointStatusEntry> {

  const start = Date.now();
  try {
    const res = await getter(url);
    logger.info(`Send request to ${url} starting at ${start}`)

    return {
      ok: true,
      url,
      status: res.status,
      timestamp: start,
      responseTime: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      url,
      status: err?.response?.status ?? 'timeout',
      timestamp: start,
      responseTime: 0,
    };
  }
}

const getNewEndpointStatus = (history: EndpointStatusEntry[], EntrySampleSize: number): EndpointStatusType => {
  let passCount = 0;
  const recentHistory =
    history.sort((prev, next) => { return next.timestamp - prev.timestamp }).slice(0, EntrySampleSize);

  if (recentHistory.length < EntrySampleSize) {
    return 'pending';
  }

  for (const h of recentHistory) {
    passCount += h.ok ? 1 : 0;

    if (passCount >= MIN_PASS_COUNT) {
      return 'online';
    }
  }
  return 'offline';
}

async function doSave(props: CreateCheckEndpointProps, statusEntry: EndpointStatusEntry) {
  const { url, serviceStatusRepository, endpointStatusEntryRepository, eventService, logger } = props;
  // create endpoint status entry before determining if the state is changed
  await EndpointStatusEntryEntity.create(endpointStatusEntryRepository, statusEntry);
  // verify that in the last [ENTRY_SAMPLE_SIZE] minutes, at least [MIN_OK_COUNT] are ok
  const recentHistory = (await endpointStatusEntryRepository.findRecentByUrl(url, ENTRY_SAMPLE_SIZE));
  const newStatus = getNewEndpointStatus(recentHistory, ENTRY_SAMPLE_SIZE);
  const healCheckJob = new HealthCheckJobs(props.logger);
  const applicationIds = healCheckJob.idsByUrl(url)
  applicationIds.forEach(async (id) => {
    const application = await serviceStatusRepository.get(id);
    // Make sure the application existed
    if (!application) {
      return;
    }

    logger.info(`${recentHistory.length} recent history for endpoint ${url} is collected.`);
    logger.info(`Current status of application ${id} is ${newStatus}`);

    const oldStatus = application.endpoint.status;
    // set the application status based on the endpoints
    if (newStatus !== oldStatus) {
      application.endpoint.status = newStatus;
      application.internalStatus = EndpointToInternalStatusMapping[newStatus];
      if (newStatus === 'pending') {
        logger.info(`Application: ${application.name} with id ${application._id} status changed to pending.`);
      }

      if (newStatus === 'online') {
        logger.info(`Application: ${application.name} with id ${application._id} status changed to healthy.`);
        eventService.send(applicationStatusToHealthy(application));
      }

      if (newStatus === 'offline') {
        logger.info(`Application: ${application.name} with id ${application._id} status changed to unhealthy.`);
        const errMessage = `The application ${application.name} with id ${application._id} becomes unhealthy.`;
        eventService.send(applicationStatusToUnhealthy(
          application, errMessage));
      }

      await serviceStatusRepository
        .save(application)
        .catch((err) => console.error('failed to update service status: ', err));
    }
  });
}