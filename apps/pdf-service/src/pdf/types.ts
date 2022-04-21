import { AdspId } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';

export interface TemplateService {
  getTemplateFunction(template: string): (context: unknown) => string;
}

export interface PdfService {
  generatePdf(content: string): Promise<Readable>;
}

export interface FileResult {
  urn: string;
  id: string;
  filename: string;
}

export interface FileService {
  upload(jobId: string, filename: string, content: Readable): Promise<FileResult>;
}

export interface PdfTemplate {
  tenantId: AdspId;
  id: string;
  name: string;
  description: string;
  template: string;
}

export type PdfJobStatus = 'queued' | 'completed' | 'failed';

export interface PdfJob {
  tenantId: AdspId;
  id: string;
  status: PdfJobStatus;
  result?: FileResult;
}
