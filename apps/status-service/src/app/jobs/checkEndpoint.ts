import axios from 'axios';
import { Logger } from 'winston';

import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntry, EndpointStatusType } from '../types';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { EventService } from '@abgov/adsp-service-sdk';
import { applicationStatusToHealthy, applicationStatusToUnhealthy } from '../events';

const ENTRY_SAMPLE_SIZE = 5;
const HEALTHY_MAX_FAIL_COUNT = 0;
const UNHEALTHY_MIN_FAIL_COUNT = 3;

type GetEndpointResponse = (url: string) => Promise<{ status: number | string }>;
export interface CreateCheckEndpointProps {
  logger?: Logger;
  url: string;
  applicationId: string;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  eventService: EventService;
  getEndpointResponse: GetEndpointResponse;
}

export function createCheckEndpointJob(props: CreateCheckEndpointProps) {
  return async (): Promise<void> => {
    const { getEndpointResponse } = props;
    // run all endpoint tests
    const statusEntry = await doRequest(getEndpointResponse, props.url, props.applicationId, props.logger);
    await doSave(props, statusEntry);
  };
}

async function doRequest(
  getEndpointResponse: GetEndpointResponse,
  url: string,
  applicationId: string,
  logger: Logger
): Promise<EndpointStatusEntry> {
  const start = Date.now();
  try {
    const { status } = await getEndpointResponse(url);
    const duration = Date.now() - start;
    logger.info(`Sent health check request to ${url} with response of ${status} and duration of ${duration} ms.`);

    return {
      ok: true,
      url,
      status,
      timestamp: start,
      responseTime: duration,
      applicationId,
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
      applicationId: null,
    };
  }
}

export const getNewEndpointStatus = (
  current: EndpointStatusType,
  samples: EndpointStatusEntry[]
): EndpointStatusType => {
  const failed = samples.filter((sample) => !sample.ok).length;

  // Starting from pending, a single sample is sufficient to establish a starting status.
  if (current === 'pending' || current === 'n/a') {
    return failed ? 'offline' : 'online';
  }
  // If currently offline, then samples less than equal (max fail) before we determine it is online.
  else if (current === 'offline' && failed <= HEALTHY_MAX_FAIL_COUNT) {
    return 'online';
  }
  // If currently online, then samples greater than equal (min fail) failed means we consider it offline.
  else if (current === 'online' && failed >= UNHEALTHY_MIN_FAIL_COUNT) {
    return 'offline';
  }

  return current;
};

async function doSave(props: CreateCheckEndpointProps, statusEntry: EndpointStatusEntry) {
  const { url, serviceStatusRepository, endpointStatusEntryRepository, eventService, logger } = props;
  // create endpoint status entry before determining if the state is changed

  await EndpointStatusEntryEntity.create(endpointStatusEntryRepository, statusEntry);
  // verify that in the last [ENTRY_SAMPLE_SIZE] minutes, at least [MIN_OK_COUNT] are ok

  const recentHistory = await endpointStatusEntryRepository.findRecentByUrlAndApplicationId(
    url,
    props.applicationId,
    ENTRY_SAMPLE_SIZE
  );

  const application = await serviceStatusRepository.get(props.applicationId);

  // Make sure the application existed
  if (!application) {
    return;
  }

  const oldStatus = application.endpoint.status;
  logger.debug(
    `Evaluating status for ${application.name} (ID: ${application._id} ) with previous status of ${oldStatus}`
  );

  const newStatus = getNewEndpointStatus(oldStatus, recentHistory);
  logger.debug(`Endpoint ${props.url} new status evaluated as: ${newStatus}`);

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

    try {
      await serviceStatusRepository.save(application);
    } catch (err) {
      logger.info(`Failed to updated application ${application.name} (ID: ${application._id}) status.`);
    }
  }
}
