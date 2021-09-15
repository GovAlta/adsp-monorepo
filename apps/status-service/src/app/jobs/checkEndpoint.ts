import { Logger } from 'winston';

import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ServiceStatusApplicationEntity } from '../model';
import { EndpointStatusEntry, ServiceStatusEndpoint } from '../types';
import { EndpointStatusEntryRepository } from '../repository/endpointStatusEntry';
import { EndpointStatusEntryEntity } from '../model/endpointStatusEntry';

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

async function doSave(props: CreateCheckEndpointProps, statusEntry: EndpointStatusEntry) {
  const { application, serviceStatusRepository, endpointStatusEntryRepository } = props;

  // overall status for application endpoints
  let allEndpointsUp = true;
  let isStatusChanged = false;

  // create endpoint status entry before determining if the state is changed
  await EndpointStatusEntryEntity.create(endpointStatusEntryRepository, statusEntry);

  // verify that in the last [ENTRY_SAMPLE_SIZE] minutes, at least [MIN_OK_COUNT] are ok
  const history = await (await endpointStatusEntryRepository.findRecentByUrl(application.endpoint.url));
  const recentHistory = history.slice(history.length - ENTRY_SAMPLE_SIZE);

  let pass = false,
    fail = false;
  let failCount = 0,
    passCount = 0;

  for (const h of recentHistory) {
    passCount += h.ok ? 1 : 0;
    failCount += h.ok ? 0 : 1;

    if (passCount >= MIN_PASS_COUNT) {
      pass = true;
      break;
    }
    if (failCount >= MIN_FAIL_COUNT) {
      fail = true;
      break;
    }
  }

  // if it doesn't pass or fail, it retains the initial value
  if (pass) {
    application.endpoint.status = 'online';
    allEndpointsUp = true;
    isStatusChanged = true;
  } else if (fail) {
    application.endpoint.status = 'offline';
    allEndpointsUp = false;
    isStatusChanged = true;
  }

  // set the application status based on the endpoints
  if (isStatusChanged) {
    application.internalStatus = allEndpointsUp ? 'healthy' : 'unhealthy';

    await serviceStatusRepository
      .save(application)
      .catch((err) => console.error('failed to update service status: ', err));
  }
}
