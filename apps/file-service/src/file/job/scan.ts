import { AdspId, EventService } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { fileScanned } from '../events';
import { File } from '../types';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';

interface ScanJobProps {
  logger: Logger;
  scanService: ScanService;
  fileRepository: FileRepository;
  eventService: EventService;
}

export const createScanJob =
  ({ logger, scanService, fileRepository, eventService }: ScanJobProps) =>
  async (tenantId: AdspId, file: File, done: (err?: Error) => void): Promise<void> => {
    const { id, filename } = file;
    try {
      logger.debug(`Scanning file ${filename} (ID: ${id})...`, {
        context: 'FileScanJob',
        tenant: tenantId?.toString(),
      });
      const result = await fileRepository.get(id);
      if (result && !result.deleted) {
        const { scanned, infected } = await scanService.scan(result);
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
          eventService.send(fileScanned(tenantId, file, infected));
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
