import { User } from '@abgov/adsp-service-sdk';
import * as NodeClam from 'clamscan';
import { Stream } from 'stream';
import { FileEntity, ScanService, ServiceUserRoles } from '../file';
import { ScanProps } from './index';

interface ClamScan {
  scanStream: (stream: Stream) => Promise<{
    is_infected: boolean;
    file: string;
    viruses: string[];
  }>;
}

export const createClamScan = ({ host, port }: ScanProps): ScanService => {
  const user = { id: 'clam-scan-service', isCore: true, roles: [ServiceUserRoles.Admin] } as User;

  const scanPromise: Promise<ClamScan> = new NodeClam().init({
    clamdscan: {
      socket: false,
      host,
      port,
      timeout: 300000,
    },
  });

  const service: ScanService = {
    scan: async (file: FileEntity) => {
      const clamscan = await scanPromise;
      const stream = await file.readFile(user);
      const scan = await clamscan.scanStream(stream);

      return {
        scanned: true,
        infected: scan.is_infected,
      };
    },
  };

  return service;
};
