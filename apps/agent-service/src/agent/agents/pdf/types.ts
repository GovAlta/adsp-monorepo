export const PDF_RETRIEVAL_TOOL = 'pdfConfigurationRetrievalTool';
export const PDF_UPDATE_TOOL = 'pdfConfigurationUpdateTool';

export const PDF_TEMPLATE_FIELDS = ['template', 'header', 'footer', 'additionalStyles', 'variables'] as const;
export type PdfTemplateField = (typeof PDF_TEMPLATE_FIELDS)[number];
export type PdfTemplateFields = Partial<Record<PdfTemplateField, string>>;

/** A PDF template definition as stored in the pdf-service configuration. */
export interface PdfDefinition extends PdfTemplateFields {
  id?: string;
  name?: string;
  description?: string;
  startWithDefault?: boolean;
}

/** Reads the saved definition of the template in the request context, or undefined when there is none. */
export type PdfDefinitionReader = (requestContext: { get(key: string): unknown }) => Promise<PdfDefinition | undefined>;
