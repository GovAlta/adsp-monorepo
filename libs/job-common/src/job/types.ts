import { AdspId } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';

export type JobStatus = 'queued' | 'completed' | 'failed';

export interface JobState<T> {
  tenantId: AdspId;
  id: string;
  status: JobStatus;
  result?: T;
}

export interface FileService {
  typeExists(tenantId: AdspId, fileType: string): Promise<boolean>;
  upload(
    tenantId: AdspId,
    fileType: string,
    recordId: string,
    filename: string,
    content: Readable
  ): Promise<FileResult>;
}

export interface FileResult {
  urn: string;
  id: string;
  filename: string;
}
