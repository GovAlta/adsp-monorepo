import { AdspId, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
//import { File } from '../types';

import { EventService, TenantService, ConfigurationService } from '@abgov/adsp-service-sdk';
// import { DateTime, Duration } from 'luxon';
// import { Logger } from 'winston';
import { FileService, FileCriteria } from '../types';
import { ServiceConfiguration } from '../configuration';
import { fileDeleted } from '../events';


// import { NotificationService } from '../../notification';
// import { formDeleted } from '../events';
// import { FormRepository } from '../repository';
// import { FormStatus } from '../types';
import { jobUser } from './user';

interface DeleteJobProps {
  tokenProvider: TokenProvider;
  serviceId: AdspId;
  logger: Logger;
  fileRepository: FileRepository;
  eventService: EventService;
  tenantService: TenantService;
  configurationService: ConfigurationService;
  // notificationService: NotificationService;
}

const getCircularReplacer = () => {
  const seen = new WeakSet();
  return (key, value) => {
    if (typeof value === "object" && value !== null) {
      if (seen.has(value)) {
        return;
      }
      seen.add(value);
    }
    return value;
  };
};

export function createDeleteOldFilesJob({
  serviceId,
  logger,
  fileRepository,
  configurationService,
  tenantService,
  tokenProvider,
  eventService,
}: DeleteJobProps) {
  return async (): Promise<void> => {
    try {
      logger.debug('Starting delete job...');

      // Load all tenants
      const tenants = await tenantService.getTenants();
      const token = await tokenProvider.getAccessToken();

       let numberDeleted = 0;

      // For each tenant, load file configuration (and core file configuration)
      tenants.forEach(async (tenant) => {
          const configuration = await configurationService.getConfiguration<ServiceConfiguration,ServiceConfiguration>(serviceId, token, tenant.id );
  
           Object.keys(configuration).forEach(async (key) => {
              if (configuration[key].rules?.retention?.active) {
                const now = new Date();
                const retention = configuration[key].rules?.retention?.deleteInDays
                const backdate = new Date(now.setDate(now.getDate() - retention));
            
                let after = null;
                do {
                const { results, page }  = await fileRepository.find(tenant.id, 20, after as string, {lastAccessedBefore: backdate.toDateString()});

                for (const file of results) {
                  if (!file.deleted) {
                    try {
                      jobUser.tenantId = file.tenantId;
                   
                      
                      const deleted = await file.markForDeletion(jobUser);
                      if (deleted) {
                        deleted.retentionDays = retention;
                        numberDeleted++;
                        eventService.send(
                          fileDeleted(jobUser, {
                            id: deleted.id,
                            filename: deleted.filename,
                            size: deleted.size,
                            recordId: deleted.recordId,
                            created: deleted.created,
                            lastAccessed: deleted.lastAccessed,
                            createdBy: deleted.createdBy,
                          })
                        );
                      }
                    } catch (err) {
                      logger.error(`Error deleting file with ID: ${file.id}. ${err}`);
                    }
                  } 
                }

                 after = page.next;
                } while (after);
              }
           })

      })  

      logger.info(`Completed file delete job and deleted ${numberDeleted} files.`);
    } catch (err) {
      logger.error(`Error encountered in file deleting job. ${err}`);
    }
  };
}

