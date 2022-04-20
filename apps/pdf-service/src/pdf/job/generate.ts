import { AdspId, ConfigurationService, EventService, TokenProvider } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { pdfGenerated, pdfGenerationFailed } from '../events';
import { PdfTemplateEntity } from '../model';
import { FileService } from '../types';
import { PdfServiceWorkItem } from './types';

export interface GenerateJobProps {
  logger: Logger;
  serviceId: AdspId;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  fileService: FileService;
  eventService: EventService;
}

const context = 'GenerateJob';
export function createGenerateJob({
  logger,
  serviceId,
  tokenProvider,
  configurationService,
  fileService,
  eventService,
}: GenerateJobProps) {
  return async (
    { tenantId, jobId, filename, template, data, generatedBy }: PdfServiceWorkItem,
    retryOnError: boolean,
    done: (err?: Error) => void
  ): Promise<void> => {
    try {
      logger.info(`Starting generation of PDF (ID: ${jobId}) file: ${filename}...`, {
        context,
        tenant: tenantId,
      });

      const token = await tokenProvider.getAccessToken();
      const [configuration] = await configurationService.getConfiguration<Record<string, PdfTemplateEntity>>(
        serviceId,
        token,
        AdspId.parse(tenantId)
      );

      const pdfTemplate = configuration[template.id];
      const pdf = await pdfTemplate.evaluate({ data });
      logger.debug(`Generation of PDF (ID: ${jobId}) completed PDF creation from content...`, {
        context,
        tenant: tenantId,
      });

      const result = await fileService.upload(jobId, filename, pdf);

      eventService.send(pdfGenerated(jobId, result, generatedBy));

      logger.info(`Generated PDF (ID: ${jobId}) file ${filename} and uploaded to file service at: ${result.urn}`, {
        context,
        tenant: tenantId,
      });

      done();
    } catch (err) {
      if (!retryOnError) {
        eventService.send(pdfGenerationFailed(jobId, generatedBy));
        logger.error(`Generation of PDF (ID: ${jobId}) failed with error. ${err}`);
      }

      done(err);
    }
  };
}
