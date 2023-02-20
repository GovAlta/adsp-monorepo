import { AdspId } from '@abgov/adsp-service-sdk';

export interface TemplateService {
  getTemplateFunction(template: string, channel?: string): (context: unknown) => string;
}

export interface PdfServiceProps {
  content: string;
  footer?: string;
  header?: string;
  css?: string;
}

export interface PdfService {
  generatePdf({ content, footer, header, css }: PdfServiceProps): Promise<Buffer>;
}

export interface FileResult {
  urn: string;
  id: string;
  filename: string;
}

export interface FileService {
  typeExists(tenantId: AdspId, fileType: string): Promise<boolean>;
  upload(tenantId: AdspId, fileType: string, recordId: string, filename: string, content: Buffer): Promise<FileResult>;
}

export interface PdfTemplate {
  tenantId: AdspId;
  id: string;
  name: string;
  description: string;
  template: string;
  footer?: string;  
  header?: string;
  css?: string;
}

export type PdfJobStatus = 'queued' | 'completed' | 'failed';

export interface PdfJob {
  tenantId: AdspId;
  id: string;
  status: PdfJobStatus;
  result?: FileResult;
}
