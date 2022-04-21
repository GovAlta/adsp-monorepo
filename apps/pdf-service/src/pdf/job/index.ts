import { WorkQueueService } from '@core-services/core-common';
import { createGenerateJob, GenerateJobProps } from './generate';
import { PdfServiceWorkItem } from './types';

export * from './types';

interface PdfJobProps extends GenerateJobProps {
  queueService: WorkQueueService<PdfServiceWorkItem>;
}

export const createPdfJobs = (props: PdfJobProps): void => {
  const scanJob = createGenerateJob(props);

  props.queueService.getItems().subscribe(({ item, retryOnError, done }) => {
    scanJob(item, retryOnError, done);
  });
};
