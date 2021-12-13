import { AdspId } from '@abgov/adsp-service-sdk';
import { Logger } from 'winston';
import { File } from '..';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';

interface ScanJobProps {
  logger: Logger;
  scanService: ScanService;
  fileRepository: FileRepository;
}

export const createScanJob =
  ({ logger, scanService, fileRepository }: ScanJobProps) =>
  async (tenantId: AdspId, { id, filename }: File, done: (err?: Error) => void): Promise<void> => {
    try {
      logger.debug(`Scanning file ${filename} (ID: ${id})...`, {
        context: 'FileScanJob',
        tenant: tenantId?.toString(),
      });
      const result = await fileRepository.get(id);
      const { scanned, infected } = await scanService.scan(result);
      if (scanned) {
        const updated = await result.updateScanResult(infected);
        if (updated.infected) {
          logger.warn(`File ${filename} (ID: ${id}) scanned as infected.`, {
            context: 'FileScanJob',
            tenant: tenantId?.toString(),
          });
        } else {
          logger.debug(`Scanned file ${filename} (ID: ${id}).`, {
            context: 'FileScanJob',
            tenant: tenantId?.toString(),
          });
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
