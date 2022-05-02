export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
}

export const defaultPdfTemplate: PdfTemplate = {
  id: '',
  name: '',
  description: '',
  template: '',
};
