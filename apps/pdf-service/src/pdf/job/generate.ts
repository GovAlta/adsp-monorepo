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
    logger.info(`Starting generation of PDF (ID: ${jobId}) file: ${filename}...`, {
      context,
      tenant: tenantIdValue,
    });

    const tenantId = AdspId.parse(tenantIdValue);
    console.log(JSON.stringify(tenantId, getCircularReplacer()) + "<-tenantId")
   
    try {
      const token = await tokenProvider.getAccessToken();
      const [configuration] = await configurationService.getConfiguration<Record<string, PdfTemplateEntity>>(
        serviceId,
        token,
        tenantId
      );

       console.log(JSON.stringify(token, getCircularReplacer()) + "<-tokentokentokentokentoken")

     // console.log(JSON.stringify(configuration, getCircularReplacer()) + "<-configuration")

      const pdfTemplate = configuration[templateId];
      if (!pdfTemplate) {
        throw new NotFoundError('PDF Template', templateId);
      }

      console.log(JSON.stringify(pdfTemplate, getCircularReplacer()) + "<-pdfTemplate")

      console.log(JSON.stringify("going to populate"))

      await pdfTemplate.populateFileList(token)

      console.log(JSON.stringify("populated"))

      await pdfTemplate.evaluateTemplates()

      console.log(JSON.stringify("evaluated"))

      const pdf = await pdfTemplate.generate({ data });
      //const pdf = null;
      logger.debug(`Generation of PDF (ID: ${jobId}) completed PDF creation from content with ${pdf.length} bytes...`, {
        context,
        tenant: tenantId,
      });

     // console.log(JSON.stringify(pdf, getCircularReplacer()) + "<-pdf")

      const result = await fileService.upload(tenantId, fileType, recordId, filename, pdf);

      console.log(JSON.stringify(result, getCircularReplacer()) + "<-result")

      eventService.send(pdfGenerated(tenantId, jobId, templateId, result, requestedBy));

      logger.info(`Generated PDF (ID: ${jobId}) file ${filename} and uploaded to file service at: ${result.urn}`, {
        context,
        tenant: tenantId,
      });

      await repository.update(jobId, 'completed', result);
      done();
    } catch (err) {
      if (!retryOnError) {
        await repository.update(jobId, 'failed');
        eventService.send(pdfGenerationFailed(tenantId, jobId, templateId, requestedBy));
        logger.error(`Generation of PDF (ID: ${jobId}) failed with error. ${err}`);
      }

      done(err);
    }
  };
}
