import { Logger } from 'winston';

import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ServiceStatusApplicationEntity } from '../model';
import { EndpointStatusEntry, ServiceStatusEndpoint, EndpointStatusType, EndpointToInternalStatusMapping } from '../types';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { EventService } from '@abgov/adsp-service-sdk';
import { applicationStatusToHealthy, applicationStatusToUnhealthy } from '../events';

const ENTRY_SAMPLE_SIZE = 5;
const MIN_PASS_COUNT = 3;

type Getter = (url: string) => Promise<{ status: number | string }>;

export interface CreateCheckEndpointProps {
  logger?: Logger;
  application: ServiceStatusApplicationEntity;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  eventService: EventService;
  getter: Getter;
}

export function createCheckEndpointJob(props: CreateCheckEndpointProps) {
  return async (): Promise<void> => {
    const { serviceStatusRepository, getter } = props;
    let { application } = props;

    // ensure the application state is in sync with the database
    application = await serviceStatusRepository.get(application._id);
    props.application = application;

    // application no longer exists
    if (!application) {
      return;
    }

    // exit in the case where the application has not yet been removed from the job queue
    if (!application.enabled) {
      return;
    }

    // run all endpoint tests
    const statusEntry = await doRequest(getter, application.endpoint);
    return await doSave(props, statusEntry);
  };
}

async function doRequest(getter: Getter, endpoint: ServiceStatusEndpoint): Promise<EndpointStatusEntry> {
  const start = Date.now();
  try {
    const res = await getter(endpoint.url);
    return {
      ok: true,
      url: endpoint.url,
      status: res.status,
      timestamp: start,
      responseTime: Date.now() - start,
    };
  } catch (err) {
    return {
      ok: false,
      url: endpoint.url,
      status: err?.response?.status ?? 'timeout',
      timestamp: start,
      responseTime: 0,
    };
  }
}

const getNewEndpointStatus = (history: EndpointStatusEntry[], EntrySampleSize: number): EndpointStatusType => {
  let passCount = 0;
  const recentHistory =
    history.sort((prev, next) => {return next.timestamp - prev.timestamp}).slice(0, EntrySampleSize);

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
  const { application, serviceStatusRepository, endpointStatusEntryRepository, eventService, logger } = props;
  // create endpoint status entry before determining if the state is changed
  await EndpointStatusEntryEntity.create(endpointStatusEntryRepository, statusEntry);

  // verify that in the last [ENTRY_SAMPLE_SIZE] minutes, at least [MIN_OK_COUNT] are ok
  const recentHistory = (await endpointStatusEntryRepository.findRecentByUrl(application.endpoint.url, ENTRY_SAMPLE_SIZE));
  const oldStatus = application.endpoint.status
  const newStatus = getNewEndpointStatus(recentHistory, ENTRY_SAMPLE_SIZE);
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
}
