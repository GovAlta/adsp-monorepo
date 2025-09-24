import { PdfMetrics, PdfTemplate, PdfGenerationResponse, PdfGenerationPayload, UpdatePDFResponse } from './model';

export const FETCH_CORE_PDF_TEMPLATES_ACTION = 'pdf/FETCH_CORE_PDF_TEMPLATES_ACTION';
export const FETCH_CORE_PDF_TEMPLATES_SUCCESS_ACTION = 'pdf/FETCH_CORE_PDF_TEMPLATES_SUCCESS_ACTION';
export const FETCH_PDF_TEMPLATES_SUCCESS_ACTION = 'pdf/FETCH_PDF_TEMPLATES_SUCCESS_ACTION';
export const UPDATE_PDF_TEMPLATE_ACTION = 'pdf/UPDATE_PDF_TEMPLATE_ACTION';
export const UPDATE_PDF_TEMPLATE_SUCCESS_ACTION = 'pdf/UPDATE_PDF_TEMPLATE_SUCCESS_ACTION';
export const UPDATE_PDF_TEMPLATE_SUCCESS_NO_REFRESH_ACTION = 'pdf/UPDATE_PDF_TEMPLATE_SUCCESS_NO_REFRESH_ACTION';
export const GENERATE_PDF_ACTION = 'pdf/GENERATE_PDF_ACTION';
export const GENERATE_PDF_SUCCESS_ACTION = 'pdf/GENERATE_PDF_SUCCESS_ACTION';
export const GENERATE_PDF_SUCCESS_PROCESSING_ACTION = 'pdf/GENERATE_PDF_SUCCESS_PROCESSING_ACTION';
export const UPDATE_PDF_RESPONSE_ACTION = 'pdf/UPDATE_PDF_RESPONSE_ACTION';
export const STREAM_PDF_SOCKET_ACTION = 'pdf/STREAM_PDF_SOCKET_ACTION';
export const SHOW_CURRENT_FILE_PDF = 'pdf/SHOW_CURRENT_FILE_PDF';
export const SHOW_CURRENT_FILE_PDF_SUCCESS = 'pdf/SHOW_CURRENT_FILE_PDF_SUCCESS';
export const SET_PDF_DISPLAY_FILE_ID = 'pdf/SET_PDF_DISPLAY_FILE_ID';
export const UPDATE_JOBS = 'pdf/UPDATE_JOBS';
export const UPDATE_TEMP_TEMPLATE = 'pdf/UPDATE_TEMP_TEMPLATE';
export const SOCKET_CHANNEL = 'pdf/SOCKET_CHANNEL';
export const ADD_TO_STREAM = 'pdf/ADD_TO_STREAM';

export interface FetchCorePdfTemplatesAction {
  type: typeof FETCH_CORE_PDF_TEMPLATES_ACTION;
}

export interface FetchPdfTemplatesSuccessAction {
  type: typeof FETCH_PDF_TEMPLATES_SUCCESS_ACTION;
  payload: Record<string, PdfTemplate>;
}
export interface FetchCorePdfTemplatesSuccessAction {
  type: typeof FETCH_CORE_PDF_TEMPLATES_SUCCESS_ACTION;
  payload: Record<string, PdfTemplate>;
}

export interface GeneratePdfSuccessAction {
  type: typeof GENERATE_PDF_SUCCESS_ACTION;
  payload: PdfGenerationResponse;
  pdfTemplate?: Record<string, PdfTemplate>;
}
export interface GeneratePdfSuccessProcessingAction {
  type: typeof GENERATE_PDF_SUCCESS_PROCESSING_ACTION;
  payload: PdfGenerationResponse;
}

export interface UpdatePdfResponseAction {
  type: typeof UPDATE_PDF_RESPONSE_ACTION;
  payload: UpdatePDFResponse;
}

// eslint-disable-next-line
export interface AddToStreamAction {
  type: typeof ADD_TO_STREAM;
  // eslint-disable-next-line
  payload: any;
}

// eslint-disable-next-line
export interface SocketChannelAction {
  type: typeof SOCKET_CHANNEL;
  // eslint-disable-next-line
  socketChannel: boolean;
}

export interface GeneratePdfAction {
  type: typeof GENERATE_PDF_ACTION;
  payload: PdfGenerationPayload;
}


export interface UpdateJobsAction {
  type: typeof UPDATE_JOBS;
  payload: { data: PdfGenerationResponse[]; templateId: string | null };
}
export interface UpdateTempTemplateAction {
  type: typeof UPDATE_TEMP_TEMPLATE;
  payload: PdfTemplate;
}

export interface StreamPdfSocketAction {
  type: typeof STREAM_PDF_SOCKET_ACTION;
  disconnect: boolean;
}

export interface UpdatePdfTemplatesAction {
  type: typeof UPDATE_PDF_TEMPLATE_ACTION;
  template: PdfTemplate;
  options?: string;
}

export interface UpdatePdfTemplatesSuccessAction {
  type: typeof UPDATE_PDF_TEMPLATE_SUCCESS_ACTION;
  payload: Record<string, PdfTemplate>;
  option: { templateId: string };
}
export interface UpdatePdfTemplatesSuccessNoRefreshAction {
  type: typeof UPDATE_PDF_TEMPLATE_SUCCESS_NO_REFRESH_ACTION;
  payload: Record<string, PdfTemplate>;
}

export interface ShowCurrentFilePdfAction {
  type: typeof SHOW_CURRENT_FILE_PDF;
  fileId: string;
}

export interface ShowCurrentFilePdfSuccessAction {
  type: typeof SHOW_CURRENT_FILE_PDF_SUCCESS;
  file: Blob;
  id: string;
}
export interface SetPdfDisplayFileIdAction {
  type: typeof SET_PDF_DISPLAY_FILE_ID;
  id: string;
}

export type PdfActionTypes =
  | FetchPdfTemplatesSuccessAction
  | FetchCorePdfTemplatesSuccessAction
  | FetchCorePdfTemplatesAction
  | UpdatePdfTemplatesAction
  | UpdatePdfTemplatesSuccessAction
  | UpdatePdfTemplatesSuccessNoRefreshAction
  | AddToStreamAction
  | SocketChannelAction
  | GeneratePdfSuccessAction
  | ShowCurrentFilePdfSuccessAction
  | SetPdfDisplayFileIdAction
  | UpdateJobsAction
  | UpdateTempTemplateAction
  | UpdatePdfResponseAction;

export const updatePdfTemplate = (template: PdfTemplate, options?: string): UpdatePdfTemplatesAction => ({
  type: UPDATE_PDF_TEMPLATE_ACTION,
  template,
  options,
});
export const updateTempTemplate = (payload: PdfTemplate): UpdateTempTemplateAction => ({
  type: UPDATE_TEMP_TEMPLATE,
  payload,
});

export const updatePdfTemplateSuccess = (
  template: Record<string, PdfTemplate>,
  option: { templateId: string }
): UpdatePdfTemplatesSuccessAction => ({
  type: UPDATE_PDF_TEMPLATE_SUCCESS_ACTION,
  payload: template,
  option: option,
});
export const updatePdfTemplateSuccessNoRefresh = (
  template: Record<string, PdfTemplate>
): UpdatePdfTemplatesSuccessNoRefreshAction => ({
  type: UPDATE_PDF_TEMPLATE_SUCCESS_NO_REFRESH_ACTION,
  payload: template,
});

export const getCorePdfTemplates = (): FetchCorePdfTemplatesAction => ({
  type: FETCH_CORE_PDF_TEMPLATES_ACTION,
});

export const getPdfTemplatesSuccess = (results: Record<string, PdfTemplate>): FetchPdfTemplatesSuccessAction => ({
  type: FETCH_PDF_TEMPLATES_SUCCESS_ACTION,
  payload: results,
});
export const getCorePdfTemplatesSuccess = (
  results: Record<string, PdfTemplate>
): FetchCorePdfTemplatesSuccessAction => ({
  type: FETCH_CORE_PDF_TEMPLATES_SUCCESS_ACTION,
  payload: results,
});

export const generatePdf = (payload: PdfGenerationPayload): GeneratePdfAction => ({
  type: GENERATE_PDF_ACTION,
  payload: payload,
});

export const streamPdfSocket = (disconnect: boolean): StreamPdfSocketAction => ({
  type: STREAM_PDF_SOCKET_ACTION,
  disconnect: disconnect,
});

export const generatePdfSuccess = (
  results: PdfGenerationResponse,
  pdfTemplate?: Record<string, PdfTemplate>
): GeneratePdfSuccessAction => ({
  type: GENERATE_PDF_SUCCESS_ACTION,
  payload: results,
  pdfTemplate: pdfTemplate,
});
export const generatePdfSuccessProcessing = (results: PdfGenerationResponse): GeneratePdfSuccessProcessingAction => ({
  type: GENERATE_PDF_SUCCESS_PROCESSING_ACTION,
  payload: results,
});

export const updatePdfResponse = (results: UpdatePDFResponse): UpdatePdfResponseAction => ({
  type: UPDATE_PDF_RESPONSE_ACTION,
  payload: results,
});

// eslint-disable-next-line
export const addToStream = (payload: any): AddToStreamAction => ({
  type: ADD_TO_STREAM,
  payload: payload,
});

export const showCurrentFilePdf = (fileId: string): ShowCurrentFilePdfAction => ({
  type: SHOW_CURRENT_FILE_PDF,
  fileId,
});

export const setPdfDisplayFileId = (id: string): SetPdfDisplayFileIdAction => ({
  type: SET_PDF_DISPLAY_FILE_ID,
  id,
});

export const showCurrentFilePdfSuccess = (file: Blob, id: string): ShowCurrentFilePdfSuccessAction => ({
  type: SHOW_CURRENT_FILE_PDF_SUCCESS,
  file,
  id,
});
