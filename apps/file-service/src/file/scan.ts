import { FileEntity } from './model';

export interface ScanResult {
  scanned: boolean;
  infected: boolean;
}

export interface ScanService {
  scan(file: FileEntity): Promise<ScanResult>;
}
