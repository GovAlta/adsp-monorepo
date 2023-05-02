import { AdspId, EventService, TenantService, TokenProvider, ConfigurationService } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';
import { File } from '../types';
import { createDeleteJob } from './delete';
import { createDeleteOldFilesJob } from './deleteOldFiles';
import { createScanJob } from './scan';
import * as schedule from 'node-schedule';
import { environment } from '../../environments/environment';

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
  scanService: ScanService;
  queueService: WorkQueueService<FileServiceWorkItem>;
  eventService: EventService;
  tenantService: TenantService;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
}

export const createFileJobs = (props: FileJobProps): void => {
  const scanJob = createScanJob(props);
  const deleteJob = createDeleteJob(props);
  const deleteOldFilesJob = createDeleteOldFilesJob(props);

  if (environment.APP_NAME === 'file-service-job') {
    console.log('we are running the jobs');
    console.log('-> Delete job below');
    schedule.scheduleJob('0 2 * * *', deleteOldFilesJob);
    props.logger.info(`Scheduled daily delete job.`);
  } else {
    props.queueService.getItems().subscribe(({ item, done }) => {
      switch (item.work) {
        case 'scan':
          scanJob(item.tenantId, item.file, done);
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
  }
};
