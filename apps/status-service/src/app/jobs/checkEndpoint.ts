import { Logger } from 'winston';
import axios from 'axios';

import { ServiceStatusRepository } from '../repository/serviceStatus';
import { ServiceStatusApplicationEntity } from '../model';

export interface CreateCheckEndpointProps {
  logger: Logger;
  application: ServiceStatusApplicationEntity;
  serviceStatusRepository: ServiceStatusRepository;
  // TODO: create/include repo for the log repo
}

interface EndpointStatus {
  ok: boolean;
  url: string;
  status: number | string;
}

export function createCheckEndpointJob({ logger, application, serviceStatusRepository }: CreateCheckEndpointProps) {
  return async (): Promise<void> => {
    // ensure the application state is in sync with the database
    application = await serviceStatusRepository.get(application.id);

    if (!application) {
      return;
    }
    // exit in the case where the application has not yet been removed from the job queue
    if (!application.enabled) {
      return;
    }

    // run all endpoint tests
    Promise.all<EndpointStatus>(
      application.endpoints.map(async (endpoint) => {
        try {
          const res = await axios.get(endpoint.url);
          return { ok: true, url: endpoint.url, status: res.status };
        } catch (err) {
          return { ok: false, url: endpoint.url, status: err?.response?.status ?? 'timeout' };
        }
      })
    ).then((endpointStatusList) => {
      endpointStatusList.forEach(({ ok, url }: EndpointStatus) => {
        application.endpoints.forEach((endpoint) => {
          if (endpoint.url === url) {
            endpoint.status = ok ? 'online' : 'offline';
            logger.info(`  ${application.name} - ${endpoint.url}: ${ok ? 'OK' : 'FAIL'}`);
          }
        });

        serviceStatusRepository
          .save(application)
          .catch((err) => console.error('failed to update service status: ', err));
      });
    });
  };
}
