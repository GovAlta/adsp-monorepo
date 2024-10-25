import { AdspId, EventService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { JobRepository, FileResult, FileService } from '@core-services/job-common';
import axios from 'axios';
import * as path from 'path';
import { pipeline, Readable } from 'stream';
import { Logger } from 'winston';
import { exported, exportFailed } from '../event';
import { getFormatter } from '../format';
import { ExportServiceWorkItem } from './types';
import { isPagedResults, retry } from './util';

const MAX_PAGES = 5000;

interface ExportJobProps {
  logger: Logger;
  directory: ServiceDirectory;
  tokenProvider: TokenProvider;
  eventService: EventService;
  repository: JobRepository<FileResult>;
  fileService: FileService;
}

export function createExportJob({
  logger,
  directory,
  tokenProvider,
  eventService,
  repository,
  fileService,
}: ExportJobProps) {
  return async ({
    tenantId: tenantIdValue,
    jobId,
    resourceId: resourceIdValue,
    params,
    fileType,
    filename,
    format,
    requestedBy,
  }: ExportServiceWorkItem) => {
    const tenantId = AdspId.parse(tenantIdValue);
    try {
      logger.debug(`Processing export job (ID: ${jobId}) for resource: ${resourceIdValue}...`, {
        context: 'ExportJob',
        tenantId: tenantIdValue,
      });
      const resourceId = AdspId.parse(resourceIdValue);
      const resourceUrl = await directory.getResourceUrl(resourceId);

      const results = [];
      let after: string,
        page = 1;
      do {
        const data = await retry.execute(async ({ attempt }) => {
          logger.debug(`Retrieving page ${page} on attempt ${attempt} for export job (ID: ${jobId})...`, {
            context: 'ExportJob',
            tenantId: tenantIdValue,
          });

          const token = await tokenProvider.getAccessToken();
          const { data } = await axios.get<{ results: unknown[]; page: { size: number; next: string } } | unknown[]>(
            resourceUrl.href,
            {
              headers: { Authorization: `Bearer ${token}` },
              params: {
                ...params,
                tenantId,
                top: 1000,
                after,
              },
            }
          );

          return data;
        });

        if (isPagedResults(data)) {
          results.push(...data.results);

          // Get the next cursor for paged results so we can get more pages.
          after = data?.page?.next;
        } else if (Array.isArray(data)) {
          results.push(...data);
        } else {
          results.push(data);
        }
        page += 1;
      } while (after || page > MAX_PAGES);

      const { extension, createTransform } = getFormatter(format);
      const records = Readable.from(results);
      const content = pipeline(records, createTransform(), (err) => {
        if (err) {
          logger.warn(`Error encountered in stream pipeline for export job (ID: ${jobId}) of ${result.urn}: ${err}`, {
            context: 'ExportJob',
            tenantId,
          });
          throw err;
        }
      });

      const result = await fileService.upload(
        tenantId,
        fileType,
        resourceIdValue,
        `${path.basename(filename, path.extname(filename))}.${extension}`,
        content
      );

      logger.debug(`Uploaded export job (ID: ${jobId}) result to ${result.urn}.`, {
        context: 'ExportJob',
        tenantId,
      });

      eventService.send(exported(tenantId, requestedBy, jobId, resourceId, format, result));
      await repository.update(jobId, 'completed', result);

      logger.info(
        `Processed export job (ID: ${jobId}) for resource: ${resourceId} and uploaded result to ${result.urn}.`,
        {
          context: 'ExportJob',
          tenantId,
        }
      );
    } catch (err) {
      // Handle the error by recording the failure; don't bother retrying in the work queue.
      await repository.update(jobId, 'failed');
      eventService.send(exportFailed(tenantId, requestedBy, jobId, resourceIdValue, format, filename));

      logger.warn(`Export job (ID: ${jobId}) for resource: ${resourceIdValue} failed with error: ${err}`, {
        context: 'ExportJob',
        tenantId: tenantIdValue,
      });
    }
  };
}
