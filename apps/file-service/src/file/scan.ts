import { FileEntity } from './model';

export interface ScanResult {
  scanned: boolean;
  infected: boolean;
  /** Names of the detected threats, when the scan provider reports them. */
  threats?: string[];
}

export interface ScanService {
  scan(file: FileEntity): Promise<ScanResult>;
}
