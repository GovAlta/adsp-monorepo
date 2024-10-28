export interface ExportServiceWorkItem {
  tenantId: string;
  jobId: string;
  timestamp: Date;
  resourceId: string;
  params: Record<string, unknown>;
  fileType: string;
  filename: string;
  format: string;
  formatOptions: Record<string, unknown>;
  requestedBy: {
    id: string;
    name: string;
  };
}
