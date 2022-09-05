export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  header: string;
  footer: string;
}

export interface PdfGenerationResponse {
  id: string;
  status: string;
  templateId: string;
  filename: string;
  result: {
    urn: string;
    id: string;
  };
  context?: {
    jobId?: string;
    templateId?: string;
  };
  data: any;
  stream: any;
  name?: string;
  fileWasGenerated: boolean;
}

export interface UpdatePDFResponse {
  fileList: FileItem[];
}

export interface PdfGenerationPayload {
  templateId: string;
  data: Record<string, SchemaType>;
  fileName: string;
}

interface SocketChannel {
  connected: boolean;
  disconnected: boolean;
}

export type SchemaType = unknown;

export interface FileItem {
  id: string;
  filename: string;
  size: number;
  fileURN: string;
  typeName?: string;
  recordId?: string;
  created?: string;
  lastAccessed?: string;
}

export interface PdfMetrics {
  pdfGenerated?: number;
  pdfFailed?: number;
  generationDuration?: number;
}

interface Stream {
  namespace: string;
  name: string;
  correlationId: string;
  context: {
    jobId: string;
    templateId: string;
  };
  timestamp: string;
  payload: {
    jobId: string;
    templateId: string;
    file?: {
      urn: string;
      id: string;
      filename: string;
    };
    requestedBy: {
      id: string;
      name: string;
    };
  };
}

export interface PdfState {
  pdfTemplates: Record<string, PdfTemplate>;
  metrics: PdfMetrics;
  stream: Stream[];
  jobs: PdfGenerationResponse[];
  status: string[];
  socketChannel: SocketChannel;
}

export const defaultPdfTemplate: PdfTemplate = {
  id: '',
  name: '',
  description: '',
  template: '',
  header: '',
  footer: '',
};
