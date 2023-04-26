import { AdspId, EventService, TenantService, NotificationService, File, TokenProvider } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';
import { FileService } from '../types';
import { createDeleteJob } from './delete';
import { createDeleteOldFilesJob } from './deleteOldFiles';
import { createScanJob } from './scan';
import * as schedule from 'node-schedule';

export interface FileServiceWorkItem {
  work: 'scan' | 'delete' | 'unknown';
  file: File;
  timestamp: Date;
  tenantId: AdspId;
}

interface FileJobProps {
  serviceId: AdspId;
  logger: Logger;
  fileRepository: FileRepository;
  // scanService: ScanService;
  queueService: WorkQueueService<FileServiceWorkItem>;
  // eventService: EventService;
  tenantService: TenantService;
  // notificationService: NotificationService;
  fileService: FileService;
  tokenProvider: TokenProvider;
}

export const createFileJobs = (props: FileJobProps): void => {
  //const scanJob = createScanJob(props);
  const deleteJob = createDeleteJob(props);
  const deleteOldFilesJob = createDeleteOldFilesJob(props);

  schedule.scheduleJob('* * * * *', deleteOldFilesJob);
  props.logger.info(`Scheduled daily delete job.`);

  props.queueService.getItems().subscribe(({ item, done }) => {
    console.log(JSON.stringify(item.work) + '<item.work');
    console.log('queue service');
    switch (item.work) {
      case 'scan':
        //scanJob(item.tenantId, item.file, done);
        break;
      case 'delete':
        deleteJob(item.tenantId, item.file, done);
        break;
      default: {
        props.logger.warn(
          `Received unrecognized file job '${item.work}' for file ${item.file.filename} (ID: ${item.file.id}).`
        );
        done();
        break;
      }
    }
  });
};
