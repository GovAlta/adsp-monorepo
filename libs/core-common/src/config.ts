import { executeAdminGet, HOSTS } from './http';
import { createLogger } from './logging';
import * as util from 'util';

const logger = createLogger('[Config]', process.env.LOG_LEVEL || 'info');
export const serviceHosts = {};
export const platformURNs = {
  'file-service': 'urn:ads:platform:file-service:v1',
  'event-service': 'urn:ads:platform:event-service:v1',
  'notify-service': 'urn:ads:platform:notify-service:v1',
};

export const getServicesHostByName = (serviceName: string) => {
  return serviceHosts[serviceName];
};

export const fetchConfig = () => {
  (async () => {
    const discoveryUrl = `${HOSTS.tenantAPI}/api/discovery/v1/urn`;
    try {
      for (const service in platformURNs) {
        try {
          logger.info(`Start to fetching urn ${platformURNs[service]}`);
          const data = await executeAdminGet(discoveryUrl, {
            params: { urn: platformURNs[service] },
          });

          serviceHosts[service] = data['url'];
        } catch (err) {
          logger.error(`Failed fetching ${platformURNs[service]}`);
        }
      }

      logger.info(`Hosts mapping cached: ${util.inspect(serviceHosts)}`);
    } catch (err) {
      logger.error(`Failed fetching hosts ${err.message}`);
    }
  })();
};
