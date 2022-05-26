export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  useWrapper: boolean;
}

export interface PdfMetrics {
  pdfGenerated?: number;
  pdfFailed?: number;
  generationDuration?: number;
}

export interface PdfState {
  pdfTemplates: Record<string, PdfTemplate>;
  metrics: PdfMetrics;
}

export const defaultPdfTemplate: PdfTemplate = {
  id: '',
  name: '',
  description: '',
  template: '',
  useWrapper: false,
};
