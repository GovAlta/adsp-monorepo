export interface PdfServiceWorkItem {
  work: 'generate' | 'unknown';
  timestamp: Date;
  jobId: string;
  tenantId: string;
  templateId: string;
  data: Record<string, unknown>;
  filename: string;
  generatedBy: {
    id: string;
    name: string;
  };
}
