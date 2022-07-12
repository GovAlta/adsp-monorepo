import {
  ADD_TO_STREAM,
  FETCH_PDF_METRICS_SUCCESS_ACTION,
  FETCH_PDF_TEMPLATES_SUCCESS_ACTION,
  PdfActionTypes,
  UPDATE_PDF_TEMPLATE_SUCCESS_ACTION,
  GENERATE_PDF_SUCCESS_ACTION,
  SOCKET_CHANNEL,
} from './action';
import { PdfState } from './model';

const defaultState: PdfState = {
  pdfTemplates: {},
  metrics: {},
  stream: [],
  jobs: [],
  socketChannel: null,
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
    case GENERATE_PDF_SUCCESS_ACTION: {
      let jobs = JSON.parse(JSON.stringify(state.jobs));

      const index = jobs.findIndex((job) => job.id === action.payload.context?.jobId);
      if (index > -1) {
        if (!jobs[index].stream) {
          jobs[index].stream = [];
        }
        jobs[index].stream.push(action.payload);
        jobs[index].status = action.payload.name;
      } else {
        jobs = [action.payload].concat(jobs);
      }
      return {
        ...state,
        jobs: jobs,
      };
    }
    case SOCKET_CHANNEL: {
      return {
        ...state,
        socketChannel: action.socketChannel,
      };
    }
    default:
      return state;
  }
}
