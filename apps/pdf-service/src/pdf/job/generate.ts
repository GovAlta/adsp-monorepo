import { AdspId, ConfigurationService, EventService, TokenProvider } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { Logger } from 'winston';
import { pdfGenerated, pdfGenerationFailed } from '../events';
import { PdfTemplateEntity } from '../model';
import { PdfJobRepository } from '../repository';
import { FileService } from '../types';
import { PdfServiceWorkItem } from './types';

export interface GenerateJobProps {
  logger: Logger;
  serviceId: AdspId;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  repository: PdfJobRepository;
  fileService: FileService;
  eventService: EventService;
}

const context = 'GenerateJob';
export function createGenerateJob({
  logger,
  serviceId,
  tokenProvider,
  configurationService,
  repository,
  fileService,
  eventService,
}: GenerateJobProps) {
  return async (
    { tenantId: tenantIdValue, jobId, fileType, filename, recordId, templateId, data, requestedBy }: PdfServiceWorkItem,
    retryOnError: boolean,
    done: (err?: Error) => void
  ): Promise<void> => {
    const pdfFilename = filename = filename.replace(/\.[^/.]+$/, "") + ".pdf";
    logger.info(`Starting generation of PDF (ID: ${jobId}) file: ${pdfFilename}...`, {
      context,
      tenant: tenantIdValue,
    });

    const tenantId = AdspId.parse(tenantIdValue);

    try {
      const token = await tokenProvider.getAccessToken();
      const [configuration] = await configurationService.getConfiguration<Record<string, PdfTemplateEntity>>(
        serviceId,
        token,
        tenantId
      );

      const pdfTemplate = configuration[templateId];
      if (!pdfTemplate) {
        throw new NotFoundError('PDF Template', templateId);
      }

      const pdf = await pdfTemplate.generate({ data });

      logger.debug(`Generation of PDF (ID: ${jobId}) completed PDF creation from content with ${pdf.length} bytes...`, {
        context,
        tenant: tenantId?.toString(),
      });

      const result = await fileService.upload(tenantId, fileType, recordId, pdfFilename, pdf);

      eventService.send(pdfGenerated(tenantId, jobId, templateId, result, requestedBy));

      logger.info(`Generated PDF (ID: ${jobId}) file ${pdfFilename} and uploaded to file service at: ${result.urn}`, {
        context,
        tenant: tenantId?.toString(),
      });

      await repository.update(jobId, 'completed', result);
      done();
    } catch (err) {
      if (!retryOnError) {
        await repository.update(jobId, 'failed');
        eventService.send(pdfGenerationFailed(tenantId, jobId, templateId, requestedBy, { error: err.toString() }));
        logger.error(`Generation of PDF (ID: ${jobId}) failed with error. ${err}`);
      }

      done(err);
    }
  };
}
