import { Logger } from 'winston';
import * as schedule from 'node-schedule';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';
import { createDeleteJob } from './delete';
import { createScanJob } from './scan';

interface FileJobProps {
  logger: Logger
  rootStoragePath: string
  fileRepository: FileRepository,
  scanService: ScanService
}

export const scheduleFileJobs = (props: FileJobProps) => {
  const deleteJob = createDeleteJob(props);
  schedule.scheduleJob('*/10 * * * *', deleteJob);
  props.logger.info(`Scheduled file delete job.`);

  if (props.scanService) {
    const scanJob = createScanJob(props);
    schedule.scheduleJob('*/5 * * * *', scanJob);
    props.logger.info(`Scheduled file scan job.`);
  }
}
