import { AdspId, EventService, TenantService, TokenProvider, ConfigurationService } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import * as schedule from 'node-schedule';
import { Logger } from 'winston';
import { environment, POD_TYPES } from '../../environments/environment';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';
import { File } from '../types';
import { createDeleteJob } from './delete';
import { createDeleteOldFilesJob } from './deleteOldFiles';
import { createDigestJob } from './digest';
import { createScanJob } from './scan';

export interface FileServiceWorkItem {
  work: 'scan' | 'delete' | 'unknown';
  file: File;
  timestamp: Date;
  tenantId: AdspId;
}

interface FileJobProps {
  apiId: AdspId;
  serviceId: AdspId;
  logger: Logger;
  fileRepository: FileRepository;
  scanService: ScanService;
  queueService: WorkQueueService<FileServiceWorkItem>;
  eventService: EventService;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
}

export const createFileJobs = (props: FileJobProps): void => {
  const scanJob = createScanJob(props);
  const digestJob = createDigestJob(props);
  const deleteJob = createDeleteJob(props);
  const deleteOldFilesJob = createDeleteOldFilesJob(props);

  // Job pod runs scheduled jobs, and also can handle work items.
  if (environment.POD_TYPE === POD_TYPES.job) {
    schedule.scheduleJob('0 2 * * *', deleteOldFilesJob);
    props.logger.info(`Scheduled daily delete job.`);
  }

  props.queueService.getItems().subscribe(({ item, done }) => {
    switch (item.work) {
      case 'scan':
        digestJob(item.tenantId, item.file, () => {
          // TODO: This job should consume a distinct item on the work queue, but currently the items are just
          // projections of file service domain events rather than dedicated work queue messages.
          //
          // Passing in work queue callback may result in interactions with the scan job; stubbing the callback
          // effectively means failure in digest will not result in retry.
        });
        scanJob(item.tenantId, item.file, done);
        break;
      case 'delete':
        deleteJob(item.tenantId, item.file, done);
        break;
      default: {
        props.logger.debug(
          `Received unrecognized file job '${item.work}' for file ${item.file.filename} (ID: ${item.file.id}).`
        );
        done();
        break;
      }
    }
  });
};
