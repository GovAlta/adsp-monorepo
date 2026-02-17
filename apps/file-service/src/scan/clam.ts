import { User } from '@abgov/adsp-service-sdk';
import * as NodeClam from 'clamscan';
import { Stream } from 'stream';
import { FileEntity, ScanService, ServiceUserRoles } from '../file';
import { ScanProps } from './index';

interface ClamScan {
  scanStream: (stream: Stream) => Promise<{
    isInfected: boolean;
    file: string;
    viruses: string[];
  }>;
}

const CLAM_FILE_MAX_SIZE = 500 * 1e6;
const CLAM_TIMEOUT_MS = 600000; // 10 minutes for large file scans

export const createClamScan = ({ host, port }: ScanProps): ScanService => {
  const user = { id: 'clam-scan-service', isCore: true, roles: [ServiceUserRoles.Admin] } as User;

  const scanPromise: Promise<ClamScan> = new NodeClam().init({
    clamdscan: {
      socket: false,
      host,
      port,
      timeout: CLAM_TIMEOUT_MS,
    },
  });

  const service: ScanService = {
    scan: async (file: FileEntity) => {
      if (file.size > CLAM_FILE_MAX_SIZE) {
        throw new Error(`File of size ${file.size / 1000}kb is too large for clam scan.`);
      }

      const clamscan = await scanPromise;
      const stream = await file.readFile(user);
      const scan = await clamscan.scanStream(stream);

      return {
        scanned: true,
        infected: scan.isInfected,
      };
    },
  };

  return service;
};
