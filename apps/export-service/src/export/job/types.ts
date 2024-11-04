export interface ExportServiceWorkItem {
  tenantId: string;
  jobId: string;
  timestamp: Date;
  resourceId: string;
  params: Record<string, unknown>;
  resultsPath: string;
  fileType: string;
  filename: string;
  format: string;
  formatOptions: Record<string, unknown>;
  requestedBy: {
    id: string;
    name: string;
  };
}
