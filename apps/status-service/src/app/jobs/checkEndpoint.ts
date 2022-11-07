import axios from 'axios';
import { Logger } from 'winston';

import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntry, EndpointStatusType } from '../types';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { EventService } from '@abgov/adsp-service-sdk';
import { applicationStatusToHealthy, applicationStatusToUnhealthy } from '../events';
import { StaticApplicationData } from '../model';

const ENTRY_SAMPLE_SIZE = 5;
const HEALTHY_MAX_FAIL_COUNT = 0;
const UNHEALTHY_MIN_FAIL_COUNT = 3;

type GetEndpointResponse = (url: string) => Promise<{ status: number | string }>;
export interface CreateCheckEndpointProps {
  logger?: Logger;
  app: StaticApplicationData;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  eventService: EventService;
  getEndpointResponse: GetEndpointResponse;
}

export function createCheckEndpointJob(props: CreateCheckEndpointProps) {
  return async (): Promise<void> => {
    const { getEndpointResponse } = props;
    // run all endpoint tests
    const statusEntry = await checkEndpoint(getEndpointResponse, props.app.url, props.app.appKey, props.logger);
    await saveStatus(props, statusEntry);
  };
}

async function checkEndpoint(
  getEndpointResponse: GetEndpointResponse,
  url: string,
  appKey: string,
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
      applicationId: appKey,
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

async function saveStatus(props: CreateCheckEndpointProps, statusEntry: EndpointStatusEntry) {
  const { app, serviceStatusRepository, endpointStatusEntryRepository, eventService, logger } = props;
  // create endpoint status entry before determining if the state is changed

  await EndpointStatusEntryEntity.create(endpointStatusEntryRepository, statusEntry);
  // verify that in the last [ENTRY_SAMPLE_SIZE] minutes, at least [MIN_OK_COUNT] are ok

  const recentHistory = await endpointStatusEntryRepository.findRecentByUrlAndApplicationId(
    app.url,
    app.appKey,
    ENTRY_SAMPLE_SIZE
  );

  const status = await serviceStatusRepository.get(app.appKey);

  // Make sure the application existed
  if (!status) {
    return;
  }

  const oldStatus = status.endpoint.status;

  const newStatus = getNewEndpointStatus(oldStatus, recentHistory);

  // set the application status based on the endpoints
  if (newStatus !== oldStatus) {
    status.endpoint.status = newStatus;

    if (newStatus === 'online') {
      eventService.send(applicationStatusToHealthy(app, status.tenantId));
    }

    if (newStatus === 'offline') {
      const errMessage = `The application ${app.name} (ID: ${app.appKey}) is unhealthy.`;
      eventService.send(applicationStatusToUnhealthy(app, status.tenantId, errMessage));
    }

    try {
      await serviceStatusRepository.save(status);
    } catch (err) {
      logger.info(`Failed to updated application ${app.name} (ID: ${app.appKey}) status.`);
    }
  }
}
