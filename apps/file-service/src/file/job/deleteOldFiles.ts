import { AdspId, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
//import { File } from '../types';

import { EventService, TenantService, ConfigurationService } from '@abgov/adsp-service-sdk';
// import { DateTime, Duration } from 'luxon';
// import { Logger } from 'winston';
import { FileService } from '../types';
import { ServiceConfiguration } from '../configuration';

// import { NotificationService } from '../../notification';
// import { formDeleted } from '../events';
// import { FormRepository } from '../repository';
// import { FormStatus } from '../types';
// import { jobUser } from './user';

interface DeleteJobProps {
  tokenProvider: TokenProvider;
  serviceId: AdspId;
  logger: Logger;
  fileRepository: FileRepository;
  // eventService: EventService;
  tenantService: TenantService;
  fileService: FileService;
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
  fileService,
  configurationService,
  tenantService,
  tokenProvider,
}: DeleteJobProps) {
  return async (): Promise<void> => {
    try {
      logger.debug('Starting delete job...');

      // Load all tenants
      const tenants = await tenantService.getTenants();
      const token = await tokenProvider.getAccessToken();

      console.log(JSON.stringify(tenants) + '< tenants=----------');

      // [
      //   {
      //     id: {
      //       type: 'resource',
      //       namespace: 'platform',
      //       service: 'tenant-service',
      //       api: 'v2',
      //       resource: '/tenants/63f54755a1f047f190ab5882',
      //     },
      //     name: 'Platform',
      //     realm: '1b0dbf9a-58be-4604-b995-18ff15dcdfd5',
      //   },
      // ];

      // For each tenant, load file configuration (and core file configuration)
      tenants.forEach(async (tenant) => {
          const configuration = await configurationService.getConfiguration<ServiceConfiguration,ServiceConfiguration>(serviceId, token, tenant.id );
          console.log(JSON.stringify(configuration, getCircularReplacer()) + "<configuration----------------")

          // {
          //   "jpg":{
          //       "anonymousRead":true,
          //       "readRoles":[
                  
          //       ],
          //       "updateRoles":[
                  
          //       ],
          //       "tenantId":{
          //         "type":"resource",
          //         "namespace":"platform",
          //         "service":"tenant-service",
          //         "api":"v2",
          //         "resource":"/tenants/63f54755a1f047f190ab5882"
          //       },
          //       "id":"jpg",
          //       "name":"jpg"
          //   },
          //   "generated-pdf":{
          //       "anonymousRead":false,
          //       "readRoles":[
          //         "urn:ads:platform:pdf-service:pdf-generator"
          //       ],
          //       "updateRoles":[
          //         "urn:ads:platform:tenant-service:platform-service"
          //       ],
          //       "id":"generated-pdf",
          //       "name":"Generated PDF",
          //       "rules":{
          //         "retention":{
          //             "active":true,
          //             "createdAt":"2023-04-20T17:19:22Z",
          //             "deleteInDays":30
          //         }
          //       }
          //   }
          // }

           // For each file type with retention policy enabled, find files that should be deleted

           Object.keys(configuration).forEach((key) => {
              if (configuration[key].rules?.retention?.active) {

              }
           })

      })  
    
  

      // For each file type with retention policy enabled, find files that should be deleted

      // Delete files

      // let after = null;
      // let numberDeleted = 0;
      //do {
      // const { results, page } = await repository.find(20, after, {
      //   statusEquals: FormStatus.Locked,
      //   lockedBefore: DateTime.now().minus(MAX_LOCKED_AGE).toJSDate(),
      // });

      // for (const result of results) {
      //   try {
      //     const deleted = await result.delete(jobUser, fileService, notificationService);
      //     if (deleted) {
      //       numberDeleted++;
      //       eventService.send(formDeleted(jobUser, result));
      //     }
      //   } catch (err) {
      //     // Log and continue with other forms if there's an error on form delete.
      //     logger.error(`Error deleting form with ID: ${result.id}. ${err}`);
      //   }
      // }

      //after = page.next;
      //} while (after);

      logger.info(`Completed file delete job and deleted ${42} files.`);
    } catch (err) {
      logger.error(`Error encountered in file deleting job. ${err}`);
    }
  };
}

// interface DeleteJobProps {
//   logger: Logger;
//   fileRepository: FileRepository;
// }

// export const createDeleteOldFilesJobxxx =
//   ({ logger, fileRepository }: DeleteJobProps) =>
//   async (tenantId: AdspId, { id, filename }: File, done: (err?: Error) => void): Promise<void> => {
//     try {
//       logger.debug(`Deleting file ${filename} (ID: ${id})...`, {
//         context: 'FileDeleteJob',
//         tenant: tenantId?.toString(),
//       });
//       console.log('DELETING FILE');
//       const result = await fileRepository.get(id);
//       if (result) {
//         const deleted = await result.delete();
//         if (deleted) {
//           logger.debug(`Deleted file ${filename} (ID: ${id}).`, {
//             context: 'FileDeleteJob',
//             tenant: tenantId?.toString(),
//           });
//         }
//       } else {
//         logger.warn(`Could not find file ${filename} (ID: ${id}) for delete.`, {
//           context: 'FileDeleteJob',
//           tenant: tenantId?.toString(),
//         });
//       }

//       done();
//     } catch (err) {
//       logger.error(`Error encountered deleting file ${filename} (ID: ${id}): ${err}`, {
//         context: 'FileDeleteJob',
//         tenant: tenantId?.toString(),
//       });
//       done(err);
//     }
//   };
