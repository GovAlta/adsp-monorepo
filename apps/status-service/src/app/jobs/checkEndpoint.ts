import axios from 'axios';
import { Logger } from 'winston';

import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntry, EndpointStatusType } from '../types';
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
    const { status } = await getter(url);
    const duration = Date.now() - start;
    logger.info(`Sent health check request to ${url} with response of ${status} and duration of ${duration} ms.`);

    return {
      ok: true,
      url,
      status,
      timestamp: start,
      responseTime: duration,
    };
  } catch (err) {
    const duration = Date.now() - start;
    const details = axios.isAxiosError(err) && err.response ? `Status (${err.response.status}) - ${err.message}` : err;
    logger.info(`Error on health check request to ${url} with duration ${duration} ms: ${details}`);
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
  let failedCount = 0;
  const recentHistory = history
    .sort((prev, next) => {
      return next.timestamp - prev.timestamp;
    })
    .slice(0, EntrySampleSize);

  for (const h of recentHistory) {
    passCount += h.ok ? 1 : 0;
    failedCount += h.ok ? 0 : 1;

    if (passCount >= MIN_PASS_COUNT) {
      return 'online';
    }

    if (failedCount > EntrySampleSize - MIN_PASS_COUNT) {
      return 'offline';
    }
  }

  if (recentHistory.length < EntrySampleSize) {
    return 'pending';
  }

  return 'offline';
};

async function doSave(props: CreateCheckEndpointProps, statusEntry: EndpointStatusEntry) {
  const { url, serviceStatusRepository, endpointStatusEntryRepository, eventService, logger } = props;
  // create endpoint status entry before determining if the state is changed
  await EndpointStatusEntryEntity.create(endpointStatusEntryRepository, statusEntry);
  // verify that in the last [ENTRY_SAMPLE_SIZE] minutes, at least [MIN_OK_COUNT] are ok
  const recentHistory = await endpointStatusEntryRepository.findRecentByUrl(url, ENTRY_SAMPLE_SIZE);
  const newStatus = getNewEndpointStatus(recentHistory, ENTRY_SAMPLE_SIZE);
  logger.debug(`Endpoint ${props.url} new status evaluated as: ${newStatus}`);

  const healCheckJob = new HealthCheckJobs(props.logger);
  const applicationIds = healCheckJob.idsByUrl(url);

  applicationIds.forEach(async (id) => {
    const application = await serviceStatusRepository.get(id);
    // Make sure the application existed
    if (!application) {
      return;
    }

    const oldStatus = application.endpoint.status;

    logger.debug(
      `Evaluating status for ${application.name} (ID: ${application._id} ) with previous status of ${oldStatus}`
    );

    // set the application status based on the endpoints
    if (newStatus !== oldStatus) {
      application.endpoint.status = newStatus;
      if (newStatus === 'pending') {
        logger.info(`Application ${application.name} (ID: ${application._id}) status changed to pending.`);
      }

      if (newStatus === 'online') {
        logger.info(`Application ${application.name} (ID: ${application._id}) status changed to healthy.`);
        eventService.send(applicationStatusToHealthy(application));
      }

      if (newStatus === 'offline') {
        logger.info(`Application ${application.name} (ID: ${application._id}) status changed to unhealthy.`);
        const errMessage = `The application ${application.name} (ID: ${application._id}) is unhealthy.`;
        eventService.send(applicationStatusToUnhealthy(application, errMessage));
      }

      await serviceStatusRepository
        .save(application)
        .catch((err) => console.error('failed to update service status: ', err));
    }
  });
}
