import { ScanService } from '../file';
import { createClamScan } from './clam';
import { createMetaDefenderScan } from './meta';

export interface ScanProps {
  host: string;
  port: number;
}

export const createScanService = (provider: string, props: ScanProps): ScanService => {
  switch (provider) {
    case 'clam':
      return createClamScan(props);
    case 'meta':
      return createMetaDefenderScan(props);
    default:
      return null;
  }
};
