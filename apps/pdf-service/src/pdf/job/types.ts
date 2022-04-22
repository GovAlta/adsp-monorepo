export interface PdfServiceWorkItem {
  work: 'generate' | 'unknown';
  timestamp: Date;
  jobId: string;
  tenantId: string;
  templateId: string;
  data: Record<string, unknown>;
  filename: string;
  requestedBy: {
    id: string;
    name: string;
  };
}
