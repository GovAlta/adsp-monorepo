export interface ExportServiceWorkItem {
  tenantId: string;
  jobId: string;
  timestamp: Date;
  resourceId: string;
  params: Record<string, unknown>;
  fileType: string;
  filename: string;
  format: string;
  requestedBy: {
    id: string;
    name: string;
  };
}
