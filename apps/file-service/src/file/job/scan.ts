import { Logger } from 'winston';
import { FileRepository } from '../repository';
import { ScanService } from '../scan';

interface ScanJobProps {
  logger: Logger;
  scanService: ScanService;
  fileRepository: FileRepository;
}

export const createScanJob = ({ logger, scanService, fileRepository }: ScanJobProps) => {
  // eslint-disable-next-line
  return async () => {
    logger.debug('Starting file scan job...');

    const scans = [];
    let after: string = null;
    do {
      const { results, page } = await fileRepository.find(10, after, { scanned: false, deleted: false });
      after = page.next;

      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        try {
          const { scanned, infected } = await scanService.scan(results[i]);
          scans.push({ scanned, infected });

          const updated = await result.updateScanResult(infected);
          if (updated.infected) {
            logger.warn(`File ${updated.filename} (ID: ${updated.id}) scanned as infected.`);
          }
        } catch (err) {
          logger.warn(`Error encountered scanning file ${result.filename} (ID: ${result.id}). ${err}`);
        }
      }
      logger.debug(`Scanned page and proceeding to next: ${after || '(none)'}...`);
    } while (after);

    const numberScanned = scans.filter((scan) => scan.scanned).length;
    const numberInfected = scans.filter((scan) => scan.infected).length;

    logger.info(`Completed file scan job; scanned ${numberScanned} and found ` + `${numberInfected} infected files.`);
    return numberInfected;
  };
};
