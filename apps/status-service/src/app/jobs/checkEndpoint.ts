import axios from 'axios';
import moment from 'moment';
import { Logger } from 'winston';
import { ServiceStatusRepository } from '../repository/serviceStatus';
import { EndpointStatusEntry, EndpointStatusType } from '../types';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { AdspId, EventService, ServiceDirectory, TokenProvider, adspId, User } from '@abgov/adsp-service-sdk';
import {
  applicationStatusToHealthy,
  applicationStatusToUnhealthy,
  monitoredServiceDown,
  monitoredServiceUp,
} from '../events';
import { Configuration, StatusConfiguration, StaticApplicationData, Webhooks } from '../model';
import { diffMinutes } from '../utils';

const ENTRY_SAMPLE_SIZE = 5;
const HEALTHY_MAX_FAIL_COUNT = 0;
const UNHEALTHY_MIN_FAIL_COUNT = 3;
const QUERY_SIZE = 6;

type GetEndpointResponse = (url: string) => Promise<{ status: number | string }>;
export interface CreateCheckEndpointProps {
  logger?: Logger;
  app: StaticApplicationData;
  serviceStatusRepository: ServiceStatusRepository;
  endpointStatusEntryRepository: EndpointStatusEntryRepository;
  eventService: EventService;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  serviceId: AdspId;
  getEndpointResponse: GetEndpointResponse;
}

export enum ServiceUserRoles {
  Admin = 'status-service-admin',
}

export function createCheckEndpointJob(props: CreateCheckEndpointProps) {
  return async (): Promise<void> => {
    try {
      props.logger?.info(`Start to run the check endpoint job.`);
      const { getEndpointResponse } = props;
      // run all endpoint tests
      await checkAndUpdateAutoChangeStatus(props);

      await checkAndUpdateAutoChangeStatus(props);

      const statusEntry = await checkEndpoint(getEndpointResponse, props.app.url, props.app.appKey, props.logger);
      await saveStatus(props, statusEntry, props.app.tenantId);

      props.logger?.info(`Successfully finished the check endpoint job.`);
    } catch (error) {
      props.logger?.error(
        `Error checking endpoint ${props?.app?.url} of tenant ${props?.app?.tenantId}: ${error.message}.`
      );
      props.logger?.error(`Error Job: `, error);
    }
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
    logger.error(`Error on health check request to ${url} with duration ${duration} ms: ${details}`);
    return {
      ok: false,
      url,
      status: err?.response?.status ?? 'timeout',
      timestamp: start,
      responseTime: 0,
      applicationId: appKey,
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

async function saveStatus(props: CreateCheckEndpointProps, statusEntry: EndpointStatusEntry, tenantId: AdspId) {
  const {
    app,
    serviceStatusRepository,
    endpointStatusEntryRepository,
    eventService,
    logger,
    directory,
    tokenProvider,
    serviceId,
  } = props;
  // create endpoint status entry before determining if the state is changed

  await EndpointStatusEntryEntity.create(endpointStatusEntryRepository, statusEntry);
  // verify that in the last [ENTRY_SAMPLE_SIZE] minutes, at least [MIN_OK_COUNT] are ok

  const configurationServiceUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service`);
  const token = await tokenProvider.getAccessToken();

  const webhooksUrl = new URL(
    `/configuration/v2/configuration/${serviceId.namespace}/push-service?tenantId=${app.tenantId}`,
    configurationServiceUrl
  );
  const statusUrl = new URL(
    `/configuration/v2/configuration/${serviceId.namespace}/status-service?tenantId=${app.tenantId}`,
    configurationServiceUrl
  );

  const user = {
    tenantId,
    roles: [ServiceUserRoles.Admin],
  } as User;

  const response = (await axios.get(webhooksUrl.href, { headers: { Authorization: `Bearer ${token}` } })) as {
    data: Configuration;
  };

  const statusResponse = (await axios.get(statusUrl.href, { headers: { Authorization: `Bearer ${token}` } })) as {
    data: StatusConfiguration;
  };

  const webhooks = response.data?.latest?.configuration.webhooks;
  const applicationWebhookIntervals = statusResponse?.data?.latest?.configuration.applicationWebhookIntervals;

  const hookIntervalList = Object.keys(applicationWebhookIntervals).map((h) => {
    return applicationWebhookIntervals[h];
  });

  webhooks &&
    Object.keys(webhooks).map(async (key) => {
      if (webhooks[key]) {
        const webhook = webhooks[key];
        const waitTimeInterval = hookIntervalList.find((i) => i.appId === webhook?.targetId)?.waitTimeInterval;

        if (webhook?.targetId === app.appKey) {
          const eventTypes = webhook.eventTypes;

          const waitTimePings = await endpointStatusEntryRepository.findRecentByUrlAndApplicationId(
            app.url,
            app.appKey,
            waitTimeInterval
          );

          let switchOffCount = 0;
          let switchOnCount = 0;
          waitTimePings.forEach((ping) => {
            if (ping.ok) {
              switchOnCount++;
            } else {
              switchOffCount++;
            }
          });

          if (switchOffCount === waitTimePings.length && switchOffCount === waitTimeInterval) {
            eventTypes.map((et) => {
              if (et.id === 'status-service:monitored-service-down') {
                if (webhook.appCurrentlyUp || webhook.appCurrentlyUp === undefined) {
                  const updatedWebhook: Webhooks = JSON.parse(JSON.stringify(webhook));
                  updatedWebhook.appCurrentlyUp = false;
                  updateAppStatus(directory, tenantId, tokenProvider, updatedWebhook, key, serviceId);

                  eventService.send(monitoredServiceDown(app, user, updatedWebhook));
                }
              }
            });
          }

          if (switchOnCount === waitTimePings.length && switchOnCount === waitTimeInterval) {
            eventTypes.map((et) => {
              if (et.id === 'status-service:monitored-service-up') {
                if (webhook.appCurrentlyUp === false || webhook.appCurrentlyUp === undefined) {
                  const updatedWebhook: Webhooks = JSON.parse(JSON.stringify(webhook));
                  updatedWebhook.appCurrentlyUp = true;
                  updateAppStatus(directory, tenantId, tokenProvider, updatedWebhook, key, serviceId);

                  eventService.send(monitoredServiceUp(app, user, updatedWebhook));
                }
              }
            });
          }
        }
      }
    });

  const recentHistory = await endpointStatusEntryRepository.findRecentByUrlAndApplicationId(
    app.url,
    app.appKey,
    ENTRY_SAMPLE_SIZE
  );

  const status = await serviceStatusRepository.get(app.appKey);

  // Make sure the status exists
  if (!status) {
    return;
  }

  const oldStatus = status.endpoint.status;

  const newStatus = getNewEndpointStatus(oldStatus, recentHistory);

  // set the application status based on the endpoints
  if (newStatus !== oldStatus) {
    status.endpoint.status = newStatus;

    if (newStatus === 'online') {
      eventService.send(applicationStatusToHealthy(app, tenantId.toString()));
    }

    if (newStatus === 'offline') {
      const errMessage = `The application ${app.name} (ID: ${app.appKey}) is unhealthy.`;
      eventService.send(applicationStatusToUnhealthy(app, tenantId.toString(), errMessage));
    }
    try {
      await serviceStatusRepository.save(status);
    } catch (err) {
      logger.error(`Failed to updated application ${app.name} (ID: ${app.appKey}) status.`);
    }
  }
}

const updateAppStatus = async (
  directory: ServiceDirectory,
  tenantId: AdspId,
  tokenProvider: TokenProvider,
  webhook: Webhooks,
  key: string,
  serviceId: AdspId
) => {
  const token = await tokenProvider.getAccessToken();
  const baseUrl = await directory.getServiceUrl(adspId`urn:ads:platform:configuration-service:v2`);
  const pushConfiguration = new URL(
    `/configuration/v2/configuration/${serviceId.namespace}/push-service?tenantId=${tenantId}`,
    baseUrl
  );

  const response = await axios.patch(
    pushConfiguration.href,
    {
      operation: 'UPDATE',
      update: {
        webhooks: { [key]: webhook },
      },
    },
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return response;
};

/**
 * This is an attached job that checks auto change status boolean flag and determines
 * what status to update based on the health check
 */
async function checkAndUpdateAutoChangeStatus(props: CreateCheckEndpointProps) {
  const { app, serviceStatusRepository, endpointStatusEntryRepository, logger } = props;

  try {
    if (app.autoChangeStatus) {
      //The history array contains 1 item for each minute.
      const recentHistory = await endpointStatusEntryRepository.findRecentByUrlAndApplicationId(
        app.url,
        app.appKey,
        QUERY_SIZE
      );

      //get first and last date time to make sure the time is 5 minutes apart.
      const mostRecentDate = new Date(recentHistory.at(0).timestamp);
      const oldestDate = new Date(recentHistory.at(-1).timestamp);
      const dateDiff = diffMinutes(oldestDate, mostRecentDate);

      const failedForMoreThanFiveMinutes =
        recentHistory.filter((hist) => {
          return !hist.ok;
        }).length >= 5 && dateDiff >= 5;
      const succeededMoreThanFiveMinutes =
        recentHistory.filter((hist) => {
          return hist.ok;
        }).length >= 5 && dateDiff >= 5;
      const currentServiceStatus = await serviceStatusRepository.get(app.appKey);

      //Set the status to opperational if it is in report issues status and
      //the the health check has failed for the last five minutes
      if (currentServiceStatus.status === 'operational' && failedForMoreThanFiveMinutes) {
        //update status to reported issues
        currentServiceStatus.status = 'reported-issues';
        serviceStatusRepository.save(currentServiceStatus);
      } else if (currentServiceStatus.status === 'reported-issues' && succeededMoreThanFiveMinutes) {
        //update status to operational
        currentServiceStatus.status = 'operational';
        serviceStatusRepository.save(currentServiceStatus);
      }
    }
  } catch (err) {
    logger.error(`checkAndUpdateAutoChangeStatus() has encountered an error: ${err}`);
  }
}
