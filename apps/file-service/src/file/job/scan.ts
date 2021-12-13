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
  async ({ id, filename }: File, done: (err?: Error) => void): Promise<void> => {
    try {
      logger.debug(`Scanning file ${filename} (ID: ${id})...`);
      const result = await fileRepository.get(id);
      const { scanned, infected } = await scanService.scan(result);
      if (scanned) {
        const updated = await result.updateScanResult(infected);
        if (updated.infected) {
          logger.warn(`File ${filename} (ID: ${id}) scanned as infected.`);
        } else {
          logger.debug(`Scanned file ${filename} (ID: ${id}).`);
        }
      }
      done();
    } catch (err) {
      logger.warn(`Error encountered scanning file ${filename} (ID: ${id}). ${err}`);
      done(err);
    }
  };
