import { Logger } from 'winston';

import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ServiceStatusApplicationEntity } from '../model';
import { EndpointStatusEntry, ServiceStatusEndpoint } from '../types';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';
import { application } from 'express';

const ENTRY_SAMPLE_SIZE = 5;
const MIN_PASS_COUNT = 3;
const MIN_FAIL_COUNT = 3;

type Getter = (url: string) => Promise<{ status: number | string }>;

export interface CreateCheckEndpointProps {
  logger?: Logger;
  application: ServiceStatusApplicationEntity;
  serviceStatusRepository: ServiceStatusRepository;

  endpointStatusEntryRepository: EndpointStatusEntryRepository;

  getter: Getter;
}

export function createCheckEndpointJob(props: CreateCheckEndpointProps) {
  return async (): Promise<void> => {
    const { serviceStatusRepository, getter } = props;
    let { application } = props;

    // ensure the application state is in sync with the database
    application = await serviceStatusRepository.get(application._id);
    props.application = application;

    if (!application) {
      return;
    }
    // exit in the case where the application has not yet been removed from the job queue
    if (application.status === 'disabled') {
      return;
    }

    // run all endpoint tests
    const endpointStatusList = await Promise.all<EndpointStatusEntry>(
      application.endpoints.map(async (endpoint) => {
        return doRequest(getter, endpoint);
      })
    );

    // save the results
    await Promise.all(
      endpointStatusList.map(async (statusEntry: EndpointStatusEntry) => {
        return await doSave(props, statusEntry);
      })
    );
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

async function doSave(props: CreateCheckEndpointProps, statusEntry: EndpointStatusEntry) {
  const { application, serviceStatusRepository, endpointStatusEntryRepository } = props;

  // overall status for application endpoints
  let allEndpointsUp = true;
  let isStatusChanged = false;

  // create endpoint status entry before determining if the state is changed
  await EndpointStatusEntryEntity.create(endpointStatusEntryRepository, statusEntry);

  await Promise.all(
    application.endpoints.map(async (endpoint) => {
      if (endpoint.url === statusEntry.url) {
        // verify that the out of the last [ENTRY_SAMPLE_SIZE], at least [MIN_OK_COUNT] are ok
        const history = await endpointStatusEntryRepository.findByUrl(endpoint.url, ENTRY_SAMPLE_SIZE);
        const pass = history.filter((h) => h.ok).length >= MIN_PASS_COUNT;
        const fail = history.filter((h) => !h.ok).length >= MIN_FAIL_COUNT;

        // if it doesn't pass or fail, it retains the initial value
        if (pass) {
          endpoint.status = 'up';
          allEndpointsUp = allEndpointsUp && true;
          isStatusChanged = true;
        } else if (fail) {
          endpoint.status = 'down';
          allEndpointsUp = allEndpointsUp && false;
          isStatusChanged = true;
        }
      }
    })
  );

  // set the application status based on the endpoints
  if (isStatusChanged) {
    application.status = allEndpointsUp ? 'operational' : 'reported-issues';
    await serviceStatusRepository
      .save(application)
      .catch((err) => console.error('failed to update service status: ', err));
  }
}
