import {
  ADD_TO_STREAM,
  FETCH_PDF_METRICS_SUCCESS_ACTION,
  FETCH_PDF_TEMPLATES_SUCCESS_ACTION,
  PdfActionTypes,
  UPDATE_PDF_TEMPLATE_SUCCESS_ACTION,
  DELETE_PDF_TEMPLATE_SUCCESS_ACTION,
  UPDATE_PDF_RESPONSE_ACTION,
  GENERATE_PDF_SUCCESS_ACTION,
  SOCKET_CHANNEL,
  SHOW_CURRENT_FILE_PDF_SUCCESS,
  SET_PDF_DISPLAY_FILE_ID,
} from './action';
import { PdfState } from './model';

const defaultState: PdfState = {
  pdfTemplates: {},
  metrics: {},
  stream: [],
  jobs: [],
  status: [],
  socketChannel: null,
  files: {},
  currentFile: null,
  currentId: '',
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
    case DELETE_PDF_TEMPLATE_SUCCESS_ACTION:
      return {
        ...state,
        pdfTemplates: {
          ...action.payload,
        },
      };
    case SET_PDF_DISPLAY_FILE_ID:
      console.log(JSON.stringify(action.id) + '<currentId');
      return {
        ...state,
        currentId: action.id,
      };
    case SHOW_CURRENT_FILE_PDF_SUCCESS:
      console.log(JSON.stringify(action.id) + '<currentId');

      return {
        ...state,
        files: {
          ...state.files,
          [action.id]: action.file,
        },
        currentFile: action.file,
        currentId: action.id,
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
    case UPDATE_PDF_RESPONSE_ACTION: {
      const jobs = JSON.parse(JSON.stringify(state.jobs));

      jobs.forEach((job, index) => {
        if (action.payload.fileList.map((file) => file.recordId).includes(job.id)) {
          jobs[index].fileWasGenerated = true;
        }
      });

      return {
        ...state,
        jobs: jobs,
      };
    }
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
        if (action.payload?.filename) {
          jobs = [action.payload].concat(jobs);
        }
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
