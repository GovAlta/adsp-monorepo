import {
  ADD_TO_STREAM,
  FETCH_PDF_METRICS_SUCCESS_ACTION,
  FETCH_PDF_TEMPLATES_SUCCESS_ACTION,
  PdfActionTypes,
  UPDATE_PDF_TEMPLATE_SUCCESS_ACTION,
  UPDATE_PDF_TEMPLATE_SUCCESS_NO_REFRESH_ACTION,
  DELETE_PDF_TEMPLATE_SUCCESS_ACTION,
  UPDATE_PDF_RESPONSE_ACTION,
  GENERATE_PDF_SUCCESS_ACTION,
  SOCKET_CHANNEL,
  SHOW_CURRENT_FILE_PDF_SUCCESS,
  SET_PDF_DISPLAY_FILE_ID,
  UPDATE_JOBS,
  UPDATE_TEMP_TEMPLATE,
  FETCH_CORE_PDF_TEMPLATES_SUCCESS_ACTION,
} from './action';
import { PdfState } from './model';

export const defaultState: PdfState = {
  pdfTemplates: {},
  corePdfTemplates: {},
  metrics: {},
  stream: [],
  jobs: [],
  status: [],
  socketChannel: null,
  reloadFile: null,
  files: {},
  currentFile: null,
  currentId: '',
  tempTemplate: null,
  openEditor: null,
};

export default function (state: PdfState = defaultState, action: PdfActionTypes): PdfState {
  switch (action.type) {
    case FETCH_PDF_TEMPLATES_SUCCESS_ACTION:
      return {
        ...state,
        pdfTemplates: action.payload,
      };
    case FETCH_CORE_PDF_TEMPLATES_SUCCESS_ACTION:
      return {
        ...state,
        corePdfTemplates: action.payload,
      };
    case UPDATE_TEMP_TEMPLATE:
      //Intentionally don't want to cause an immediate refresh on update, as it refreshed the preview pane on text input
      state.tempTemplate = action.payload;
      return state;
    case UPDATE_PDF_TEMPLATE_SUCCESS_ACTION:
      return {
        ...state,
        pdfTemplates: {
          ...action.payload,
        },
        openEditor: action.option.templateId,
      };
    case UPDATE_PDF_TEMPLATE_SUCCESS_NO_REFRESH_ACTION:
      state.pdfTemplates = { ...state.pdfTemplates, ...action.payload };
      state.currentId = null;
      return state;
    case DELETE_PDF_TEMPLATE_SUCCESS_ACTION:
      return {
        ...state,
        pdfTemplates: {
          ...action.payload,
        },
      };
    case SET_PDF_DISPLAY_FILE_ID:
      return {
        ...state,
        currentId: action.id,
        openEditor: null,
      };
    case SHOW_CURRENT_FILE_PDF_SUCCESS:
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
    case UPDATE_JOBS: {
      const currentTemplateJobs = action.payload.data.find((job) => job.templateId === action.payload.templateId);
      const currentId = currentTemplateJobs?.stream.find((x) => x.name === 'pdf-generated').payload?.file?.id;

      return {
        ...state,
        jobs: action.payload.data,
        currentId: currentId,
      };
    }
    case GENERATE_PDF_SUCCESS_ACTION: {
      let jobs = JSON.parse(JSON.stringify(state.jobs));
      const actionKey = action.pdfTemplate && Object.keys(action.pdfTemplate)[0];
      const pdfTemplate = state.pdfTemplates;

      if (actionKey) {
        pdfTemplate[actionKey] = action.pdfTemplate[actionKey];
      }

      let index = jobs.findIndex((job) => job.id === action.payload.context?.jobId);
      if (index > -1) {
        if (!jobs[index].stream) {
          jobs[index].stream = [];
        }
        jobs[index].stream.push(action.payload);
        jobs[index].status = action.payload.name;
        jobs[index].payload = { ...action.payload?.payload };
      } else {
        if (action.payload?.filename) {
          jobs = [action.payload].concat(jobs);
        }
        index = 0;
      }

      return {
        ...state,
        jobs: jobs,
        reloadFile: { ...state.reloadFile, [jobs[index].templateId]: action.payload?.payload?.file?.id },
        pdfTemplates: { ...pdfTemplate },
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
