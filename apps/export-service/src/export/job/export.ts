import { AdspId, EventService, ServiceDirectory, TokenProvider } from '@abgov/adsp-service-sdk';
import { JobRepository, FileResult, FileService } from '@core-services/job-common';
import axios from 'axios';
import * as _ from 'lodash';
import * as path from 'path';
import { Readable } from 'stream';
import { Logger } from 'winston';
import { exported, exportFailed } from '../events';
import { getFormatter } from '../format';
import { ExportServiceWorkItem } from './types';
import { isPaged, retry } from './util';

const MAX_PAGES = 10000;

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
    resultsPath,
    fileType,
    filename,
    format,
    formatOptions,
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

      logger.debug(`Export job (ID: ${jobId}) resource URL resolved to: ${resourceUrl}`, {
        context: 'ExportJob',
        tenantId: tenantIdValue,
      });

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
          const { data } = await axios.get<unknown>(resourceUrl.href, {
            headers: { Authorization: `Bearer ${token}` },
            params: {
              ...params,
              tenantId,
              top: 200,
              after,
            },
            timeout: 60000,
          });

          return data;
        });

        const pageResults = _.get(data, resultsPath);
        if (Array.isArray(pageResults)) {
          results.push(...pageResults);
        } else if (Array.isArray(data)) {
          results.push(...data);
        } else {
          results.push(data);
        }
        logger.debug(
          `After page ${page} request for export job (ID: ${jobId}) total retrieved results: ${results.length}`,
          {
            context: 'ExportJob',
            tenantId: tenantIdValue,
          }
        );

        if (isPaged(data)) {
          // Get the next cursor for paged results so we can get more pages.
          after = data.page.next;
        }

        page += 1;
      } while (after || page > MAX_PAGES);

      const { extension, applyTransform } = await getFormatter(format);
      const records = Readable.from(results);
      const content = applyTransform(formatOptions, records, (err) => {
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
        jobId,
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

      const error = axios.isAxiosError(err) ? err.response?.data?.errorMessage || err.message : err.toString();
      eventService.send(exportFailed(tenantId, requestedBy, jobId, resourceIdValue, format, filename, error));

      logger.warn(`Export job (ID: ${jobId}) for resource: ${resourceIdValue} failed with error: ${error}`, {
        context: 'ExportJob',
        tenantId: tenantIdValue,
      });
    }
  };
}
