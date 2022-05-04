import { PdfTemplate } from './model';

export const FETCH_PDF_TEMPLATES_ACTION = 'pdf/FETCH_PDF_TEMPLATES_ACTION';
export const FETCH_PDF_TEMPLATES_SUCCESS_ACTION = 'pdf/FETCH_PDF_TEMPLATES_SUCCESS_ACTION';

export const UPDATE_PDF_TEMPLATE_ACTION = 'pdf/UPDATE_PDF_TEMPLATE_ACTION';
export const UPDATE_PDF_TEMPLATE_SUCCESS_ACTION = 'pdf/UPDATE_PDF_TEMPLATE_SUCCESS_ACTION';

export interface FetchPdfTemplatesAction {
  type: typeof FETCH_PDF_TEMPLATES_ACTION;
}

export interface FetchPdfTemplatesSuccessAction {
  type: typeof FETCH_PDF_TEMPLATES_SUCCESS_ACTION;
  payload: Record<string, PdfTemplate>;
}
export interface UpdatePdfTemplatesAction {
  type: typeof UPDATE_PDF_TEMPLATE_ACTION;
  template: PdfTemplate;
}

export interface UpdatePdfTemplatesSuccessAction {
  type: typeof UPDATE_PDF_TEMPLATE_SUCCESS_ACTION;
  payload: Record<string, PdfTemplate>;
}
export type PdfActionTypes =
  | FetchPdfTemplatesSuccessAction
  | FetchPdfTemplatesAction
  | UpdatePdfTemplatesAction
  | UpdatePdfTemplatesSuccessAction;

export const updatePdfTemplate = (template: PdfTemplate): UpdatePdfTemplatesAction => ({
  type: UPDATE_PDF_TEMPLATE_ACTION,
  template,
});
export const updatePdfTemplateSuccess = (template: Record<string, PdfTemplate>): UpdatePdfTemplatesSuccessAction => ({
  type: UPDATE_PDF_TEMPLATE_SUCCESS_ACTION,
  payload: template,
});
export const getPdfTemplates = (): FetchPdfTemplatesAction => ({
  type: FETCH_PDF_TEMPLATES_ACTION,
});

export const getPdfTemplatesSuccess = (results: Record<string, PdfTemplate>): FetchPdfTemplatesSuccessAction => ({
  type: FETCH_PDF_TEMPLATES_SUCCESS_ACTION,
  payload: results,
});
