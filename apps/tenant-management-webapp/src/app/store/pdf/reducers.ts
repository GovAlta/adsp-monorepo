import { FETCH_PDF_TEMPLATES_SUCCESS_ACTION, PdfActionTypes, UPDATE_PDF_TEMPLATE_SUCCESS_ACTION } from './action';
import { PdfState } from './model';

const defaultState: PdfState = {
  pdfTemplates: {},
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
    default:
      return state;
  }
}
