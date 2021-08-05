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
  return () => {
    logger.debug('Starting file scan job...');

    return fileRepository
      .find(20, null, { scanned: false, deleted: false })
      .then((result) =>
        Promise.all(
          result.results.map((result) =>
            scanService
              .scan(result)
              .then((scan) => {
                if (scan.scanned) {
                  result.updateScanResult(scan.infected).then((updated) => {
                    if (scan.infected && updated.deleted) {
                      logger.warn(
                        `File ${updated.id} (${updated.filename}:${updated.storage}) ` +
                          `marked for deletion because it scanned as infected.`
                      );
                    }
                  });
                }
                return scan;
              })
              .catch((err) => {
                logger.warn(`Error encountered scanning file ` + `${result.filename} (ID: ${result.id}): ${err}`);

                return { scanned: false, infected: false };
              })
          )
        )
      )
      .then((scans) => {
        const numberScanned = scans.filter((scan) => scan.scanned).length;
        const numberInfected = scans.filter((scan) => scan.infected).length;
        logger.info(
          `Completed file scan job; scanned ${numberScanned} and found ` + `${numberInfected} infected files.`
        );
        return numberInfected;
      });
  };
};
