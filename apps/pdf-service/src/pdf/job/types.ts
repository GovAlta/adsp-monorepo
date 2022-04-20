import { PdfTemplate } from '../types';

export interface PdfServiceWorkItem {
  work: 'generate' | 'unknown';
  timestamp: Date;
  tenantId: string;
  jobId: string;
  data: Record<string, unknown>;
  template: PdfTemplate;
  filename: string;
  generatedBy: {
    id: string;
    name: string;
  };
}
