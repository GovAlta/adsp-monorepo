import { FileEntity } from '../model';
import { createClamScan } from './clam';
import { createMetaDefenderScan } from './meta';

interface ScanResult {
  scanned: boolean
  infected: boolean
}

export interface ScanProps {
  rootStoragePath: string
  host: string
  port: number
}

export interface ScanService {
  scan(file: FileEntity): Promise<ScanResult>
}

export const createScanService = (
  provider: string, 
  props: ScanProps
) => {
  switch (provider) {
    case 'clam':
      return createClamScan(props);
    case 'meta':
      return createMetaDefenderScan(props); 
    default:
      return null;
  }
}
