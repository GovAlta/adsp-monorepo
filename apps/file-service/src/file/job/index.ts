import { AdspId } from '@abgov/adsp-service-sdk';
import { WorkQueueService } from '@core-services/core-common';
import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';
import { File } from '../types';
import { createDeleteJob } from './delete';
import { createScanJob } from './scan';

export interface FileServiceWorkItem {
  work: 'scan' | 'delete' | 'unknown';
  file: File;
  timestamp: Date;
  tenantId: AdspId;
}

interface FileJobProps {
  logger: Logger;
  fileRepository: FileRepository;
  scanService: ScanService;
  queueService: WorkQueueService<FileServiceWorkItem>;
}

export const createFileJobs = (props: FileJobProps): void => {
  const scanJob = createScanJob(props);
  const deleteJob = createDeleteJob(props);

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
};
