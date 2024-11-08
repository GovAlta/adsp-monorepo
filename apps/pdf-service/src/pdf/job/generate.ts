import { AdspId, ConfigurationService, EventService, TokenProvider } from '@abgov/adsp-service-sdk';
import { NotFoundError } from '@core-services/core-common';
import { FileResult, FileService, JobRepository } from '@core-services/job-common';
import * as path from 'path';
import { Logger } from 'winston';
import axios from 'axios';
import { pdfGenerated, pdfGenerationFailed } from '../events';
import { PdfTemplateEntity } from '../model';
import { PdfServiceWorkItem } from './types';

export interface GenerateJobProps {
  logger: Logger;
  serviceId: AdspId;
  tokenProvider: TokenProvider;
  configurationService: ConfigurationService;
  repository: JobRepository<FileResult>;
  fileService: FileService;
  eventService: EventService;
}

const ExtractCurrentRefs = async (dataSchema) => {
  const properties = dataSchema?.properties || dataSchema?.definitions || [];
  let propertyName = dataSchema?.definitions && 'definitions';
  propertyName = dataSchema?.properties ? 'properties' : null;

  const result = dataSchema;

  for (const prop of Object.keys(properties)) {
    if (properties[prop].$ref) {
      try {
        const refArray = properties[prop].$ref.split('#/');

        // eslint-disable-next-line
        const { data } = await axios.get<Record<string, Record<string, any[]>>>(properties[prop].$ref);

        // eslint-disable-next-line
        let parsedData = Object.assign({}, data) as any;

        refArray[1].split('/').forEach((key) => {
          parsedData = parsedData[key];
        });

        const resolvedData = await ExtractCurrentRefs(parsedData);
        result[propertyName][prop] = resolvedData;
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    } else if (properties[prop].type === 'object') {
      result[propertyName][prop] = await ExtractCurrentRefs(properties[prop]);
    } else {
      result[propertyName][prop] = properties[prop];
    }
  }

  if (dataSchema?.allOf) {
    if (!result[propertyName]) {
      result[propertyName] = {};
    }
    result[propertyName].allOf = await Promise.all(
      dataSchema.allOf.map(async (item) => {
        return await ExtractCurrentRefs(item);
      })
    );
  }

  return result;
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
    const pdfFilename = path.basename(filename, path.extname(filename)) + '.pdf';
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

      const dataSchema = Object.assign({}, data.content?.config?.dataSchema);
      const newDataSchema = await ExtractCurrentRefs(dataSchema);
      if (data.content?.config?.dataSchema) {
        data.content.config.dataSchema = newDataSchema;
      }

      const pdf = await pdfTemplate.generate({ data });

      logger.debug(`Generation of PDF (ID: ${jobId}) completed PDF creation from content...`, {
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
