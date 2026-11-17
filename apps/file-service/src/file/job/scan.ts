import { AdspId, AuditService, EventService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import {
  FileScanCompletedAuditAction,
  FileScanThreatFoundAuditAction,
  FileServiceJobAuditActor,
  toFileAuditDetails,
} from '../audit';
import { fileScanned } from '../events';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';
import { File } from '../types';

interface ScanJobProps {
  apiId: AdspId;
  logger: Logger;
  scanService: ScanService;
  fileRepository: FileRepository;
  eventService: EventService;
  auditService: AuditService;
}

export const createScanJob =
  ({ apiId, logger, scanService, fileRepository, eventService, auditService }: ScanJobProps) =>
  async (tenantId: AdspId, file: File, done: (err?: Error) => void): Promise<void> => {
    const { id, filename } = file;
    try {
      logger.debug(`Scanning file ${filename} (ID: ${id})...`, {
        context: 'FileScanJob',
        tenant: tenantId?.toString(),
      });
      const result = await fileRepository.get(id);
      if (result && !result.deleted) {
        const { scanned, infected, threats } = await scanService.scan(result);
        if (scanned) {
          const updated = await result.updateScanResult(infected);
          if (updated.infected) {
            logger.warn(`File ${filename} (ID: ${id}) scanned as infected.`, {
              context: 'FileScanJob',
              tenant: tenantId?.toString(),
            });
          } else {
            logger.info(`Scanned file ${filename} (ID: ${id}).`, {
              context: 'FileScanJob',
              tenant: tenantId?.toString(),
            });
          }
          eventService.send(fileScanned(apiId, result, infected));

          // Recorded from the asynchronous scan result rather than the upload, which completes before the scan.
          const threatMetadata = threats?.length ? { threats } : {};
          void auditService.record(
            FileScanCompletedAuditAction,
            toFileAuditDetails(FileServiceJobAuditActor, result, {
              scanResult: infected ? 'threat' : 'clean',
              ...threatMetadata,
            }),
          );
          if (infected) {
            void auditService.record(
              FileScanThreatFoundAuditAction,
              toFileAuditDetails(FileServiceJobAuditActor, result, threatMetadata),
            );
          }
        }
      }
      done();
    } catch (err) {
      logger.warn(`Error encountered scanning file ${filename} (ID: ${id}). ${err}`, {
        context: 'FileScanJob',
        tenant: tenantId?.toString(),
      });
      done(err);
    }
  };
