import { AdspId } from '@abgov/adsp-service-sdk';
import { Readable } from 'stream';
import { Logger } from 'winston';

export interface TemplateService {
  getTemplateFunction(template: string, channel?: string, tenantId?: AdspId): (context: unknown) => string;
}

export interface PdfServiceProps {
  content: string;
  footer?: string;
  header?: string;
  logger: Logger;
}

export interface UserInfo {
  id: string;
  name: string;
}

export interface PdfService {
  generatePdf({ content, footer, header, logger }: PdfServiceProps): Promise<Readable>;
}

export interface FileResult {
  urn: string;
  id: string;
  filename: string;
}

export interface PdfTemplate {
  tenantId: AdspId;
  id: string;
  name: string;
  description: string;
  template: string;
  footer?: string;
  header?: string;
  additionalStyles?: string;
  startWithDefault?: boolean;
  logger: Logger;
}
