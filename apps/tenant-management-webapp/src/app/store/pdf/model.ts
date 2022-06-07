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
  result: {
    urn: string;
    id: string;
  };
}

export interface PdfGenerationPayload {
  templateId: string;
  data: Record<string, SchemaType>;
  fileName: string;
}

export type SchemaType = unknown;

export interface PdfMetrics {
  pdfGenerated?: number;
  pdfFailed?: number;
  generationDuration?: number;
}

export interface PdfState {
  pdfTemplates: Record<string, PdfTemplate>;
  metrics: PdfMetrics;
  // eslint-disable-next-line
  stream: any[];
}

export const defaultPdfTemplate: PdfTemplate = {
  id: '',
  name: '',
  description: '',
  template: '',
  useWrapper: false,
};
