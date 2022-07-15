export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  useWrapper: boolean;
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
  socketChannel: SocketChannel;
}

export const defaultPdfTemplate: PdfTemplate = {
  id: '',
  name: '',
  description: '',
  template: '',
  useWrapper: false,
};
