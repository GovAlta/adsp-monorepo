import { template } from 'handlebars';
import { PdfMetrics, PdfTemplate, PdfGenerationResponse, PdfGenerationPayload } from './model';

export const FETCH_PDF_TEMPLATES_ACTION = 'pdf/FETCH_PDF_TEMPLATES_ACTION';
export const FETCH_PDF_TEMPLATES_SUCCESS_ACTION = 'pdf/FETCH_PDF_TEMPLATES_SUCCESS_ACTION';

export const UPDATE_PDF_TEMPLATE_ACTION = 'pdf/UPDATE_PDF_TEMPLATE_ACTION';
export const UPDATE_PDF_TEMPLATE_SUCCESS_ACTION = 'pdf/UPDATE_PDF_TEMPLATE_SUCCESS_ACTION';

export const FETCH_PDF_METRICS_ACTION = 'pdf/FETCH_PDF_METRICS';
export const FETCH_PDF_METRICS_SUCCESS_ACTION = 'pdf/FETCH_PDF_METRICS_SUCCESS';

export const GENERATE_PDF_ACTION = 'pdf/GENERATE_PDF_ACTION';
export const GENERATE_PDF_SUCCESS_ACTION = 'pdf/GENERATE_PDF_SUCCESS_ACTION';
export const STREAM_PDF_SOCKET_ACTION = 'pdf/STREAM_PDF_SOCKET_ACTION';

export const ADD_TO_STREAM = 'pdf/ADD_TO_STREAM';

export interface FetchPdfTemplatesAction {
  type: typeof FETCH_PDF_TEMPLATES_ACTION;
}

export interface FetchPdfTemplatesSuccessAction {
  type: typeof FETCH_PDF_TEMPLATES_SUCCESS_ACTION;
  payload: Record<string, PdfTemplate>;
}

export interface GeneratePdfSuccessAction {
  type: typeof GENERATE_PDF_SUCCESS_ACTION;
  payload: PdfGenerationResponse;
}

// eslint-disable-next-line
export interface AddToStreamAction {
  type: typeof ADD_TO_STREAM;
  // eslint-disable-next-line
  payload: any;
}

export interface GeneratePdfAction {
  type: typeof GENERATE_PDF_ACTION;
  payload: PdfGenerationPayload;
}

export interface StreamPdfSocketAction {
  type: typeof STREAM_PDF_SOCKET_ACTION;
  disconnect: boolean;
  templateId: string;
}

export interface UpdatePdfTemplatesAction {
  type: typeof UPDATE_PDF_TEMPLATE_ACTION;
  template: PdfTemplate;
}

export interface UpdatePdfTemplatesSuccessAction {
  type: typeof UPDATE_PDF_TEMPLATE_SUCCESS_ACTION;
  payload: Record<string, PdfTemplate>;
}

export interface FetchPdfMetricsAction {
  type: typeof FETCH_PDF_METRICS_ACTION;
}

export interface FetchPdfMetricsSuccessAction {
  type: typeof FETCH_PDF_METRICS_SUCCESS_ACTION;
  metrics: PdfMetrics;
}

export type PdfActionTypes =
  | FetchPdfTemplatesSuccessAction
  | FetchPdfTemplatesAction
  | UpdatePdfTemplatesAction
  | UpdatePdfTemplatesSuccessAction
  | FetchPdfMetricsAction
  | FetchPdfMetricsSuccessAction
  | FetchPdfMetricsSuccessAction
  | AddToStreamAction;

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

export const generatePdf = (payload: PdfGenerationPayload): GeneratePdfAction => ({
  type: GENERATE_PDF_ACTION,
  payload: payload,
});

export const streamPdfSocket = (disconnect: boolean, templateId: string): StreamPdfSocketAction => ({
  type: STREAM_PDF_SOCKET_ACTION,
  disconnect: disconnect,
  templateId: templateId,
});

export const generatePdfSuccess = (results: PdfGenerationResponse): GeneratePdfSuccessAction => ({
  type: GENERATE_PDF_SUCCESS_ACTION,
  payload: results,
});

// eslint-disable-next-line
export const addToStream = (payload: any): AddToStreamAction => ({
  type: ADD_TO_STREAM,
  payload: payload,
});

export const fetchPdfMetrics = (): FetchPdfMetricsAction => ({
  type: FETCH_PDF_METRICS_ACTION,
});

export const fetchPdfMetricsSucceeded = (metrics: PdfMetrics): FetchPdfMetricsSuccessAction => ({
  type: FETCH_PDF_METRICS_SUCCESS_ACTION,
  metrics,
});
