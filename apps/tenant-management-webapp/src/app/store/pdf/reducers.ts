import {
  ADD_TO_STREAM,
  FETCH_PDF_METRICS_SUCCESS_ACTION,
  FETCH_PDF_TEMPLATES_SUCCESS_ACTION,
  PdfActionTypes,
  UPDATE_PDF_TEMPLATE_SUCCESS_ACTION,
} from './action';
import { PdfState } from './model';

const defaultState: PdfState = {
  pdfTemplates: {},
  metrics: {},
  stream: [],
};

export default function (state: PdfState = defaultState, action: PdfActionTypes): PdfState {
  switch (action.type) {
    case FETCH_PDF_TEMPLATES_SUCCESS_ACTION:
      return {
        ...state,
        pdfTemplates: action.payload,
      };
    case UPDATE_PDF_TEMPLATE_SUCCESS_ACTION:
      return {
        ...state,
        pdfTemplates: {
          ...action.payload,
        },
      };
    case FETCH_PDF_METRICS_SUCCESS_ACTION:
      return {
        ...state,
        metrics: action.metrics,
      };
    case ADD_TO_STREAM:
      return {
        ...state,
        stream: [...state.stream, action.payload],
      };
    default:
      return state;
  }
}
