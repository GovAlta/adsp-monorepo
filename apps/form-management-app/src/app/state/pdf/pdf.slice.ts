import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from '../store';
import { CONFIGURATION_SERVICE_ID } from '../types';
import { getAccessToken } from '../user/user.slice';
import { connectPdfSocket, disconnectPdfSocket } from './socket';

export const PDF_FEATURE_KEY = 'pdf';

export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  header: string;
  additionalStyles: string;
  footer: string;
  variables?: string;
  startWithDefault?: boolean;
}

export interface PdfFileMetadata {
  urn: string;
  filename: string;
  mimeType?: string;
  recordId?: string;
}

export interface UpdatePdfConfig {
  operation: string;
  update: Record<string, PdfTemplate>;
}

export interface CreatePdfConfig {
  operation: string;
  templateId: string;
  // eslint-disable-next-line
  data: Record<string, any>;
  filename: string;
}

const PUSH_SERVICE_ID = 'urn:ads:platform:push-service';
const PDF_SERVICE_ID = 'urn:ads:platform:pdf-service';

const FILE_SERVICE_ID = 'urn:ads:platform:file-service';

export function readFileAsync(file: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    reader.onloadend = () => {
      const base64Data = (reader.result as string).split(',')[1];
      resolve(base64Data);
    };

    reader.onerror = (error: ProgressEvent<FileReader>) => reject(error);
  });
}

export const streamPdfSocket = createAsyncThunk(
  'pdf/stream-pdf-socket',
  async ({ disconnect }: { disconnect: boolean }, { getState, dispatch, rejectWithValue }) => {
    try {
      const { user } = getState() as AppState;
      const { config } = getState() as AppState;

      const pushServiceUrl = config.directory[PUSH_SERVICE_ID];
      const token = await getAccessToken();

      if (disconnect) {
        disconnectPdfSocket();
        return;
      }

      connectPdfSocket(pushServiceUrl, token, dispatch as import('../store').AppDispatch);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      }
      throw err;
    }
  }
);

export const generatePdf = createAsyncThunk(
  'pdf/generate',
  async (
    payload: {
      templateId: string;
      // eslint-disable-next-line
      data: any;
      fileName: string;
      // eslint-disable-next-line
      inputData?: any;
    },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as AppState;
      const pdfServiceUrl = state.config.directory[PDF_SERVICE_ID];
      const baseUrl = state.config.directory[CONFIGURATION_SERVICE_ID];
      const tempTemplate = state.pdf.tempTemplate;
      const token = await getAccessToken();

      if (!(pdfServiceUrl && token && baseUrl)) {
        return rejectWithValue({
          message: 'Missing configuration URLs or token',
        });
      }

      const pdfTemplate = tempTemplate
        ? {
            [tempTemplate.id]: {
              ...tempTemplate,
            },
          }
        : {};

      const saveBody: UpdatePdfConfig = {
        operation: 'UPDATE',
        update: { ...pdfTemplate },
      };

      const saveUrl = `${baseUrl}/configuration/v2/configuration/platform/pdf-service`;

      await axios.patch(saveUrl, saveBody, { headers: { Authorization: `Bearer ${token}` } });

      const combinedData = payload.data;
      if (payload.inputData) {
        combinedData.content = { data: payload.inputData };
      }

      const pdfData = {
        templateId: payload?.templateId,
        data: combinedData,
        filename: payload.fileName,
      };

      const createJobUrl = `${pdfServiceUrl}/pdf/v1/jobs`;
      const body: CreatePdfConfig = {
        operation: 'generate',
        ...pdfData,
      };

      const { data } = await axios.post(createJobUrl, body, { headers: { Authorization: `Bearer ${token}` } });

      return { ...body, ...data, pdfTemplate };
      // eslint-disable-next-line
    } catch (err: any) {
      return rejectWithValue({
        status: err.response?.status,
        message: err.response?.data?.errorMessage || err.message,
      });
    }
  }
);

export const showCurrentFilePdf = createAsyncThunk(
  'pdf/view',
  async ({ fileId }: { fileId?: string } = {}, { getState, rejectWithValue }) => {
    if (!fileId) {
      return rejectWithValue({
        message: 'fileId is required',
      });
    }
    try {
      const state = getState() as AppState;

      const fileServiceUrl = state.config.directory[FILE_SERVICE_ID];
      const baseUrl = state.config.directory[CONFIGURATION_SERVICE_ID];

      const token = await getAccessToken();

      if (!(fileServiceUrl && token && baseUrl)) {
        return rejectWithValue({
          message: 'Missing configuration URLs or token',
        });
      }

      const saveUrl = `${fileServiceUrl}/file/v1/files/${fileId}/download?unsafe=true`;
      const { data } = await axios.get(saveUrl, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      const responseFile = await readFileAsync(data);

      return { responseFile, fileId };
      // eslint-disable-next-line
    } catch (err: any) {
      return rejectWithValue({
        status: err.response?.status,
        message: err.response?.data?.errorMessage || err.message,
      });
    }
  }
);
export const getCorePdfTemplates = createAsyncThunk(
  'pdf/get-core-templates',
  async (_, { getState, rejectWithValue }) => {
    try {
      const state = getState() as AppState;
      const configBaseUrl = state.config.directory[CONFIGURATION_SERVICE_ID];
      const token = await getAccessToken();

      if (configBaseUrl && token) {
        const corePdfUrl = `${configBaseUrl}/configuration/v2/configuration/platform/pdf-service?core`;
        const { data } = await axios.get(corePdfUrl, { headers: { Authorization: `Bearer ${token}` } });
        const configuration = data.latest?.configuration;

        return configuration;
      }
      // eslint-disable-next-line
    } catch (err: any) {
      return rejectWithValue({
        status: err.response?.status,
        message: err.response?.data?.errorMessage || err.message,
      });
    }
  }
);

export const setPdfDisplayFileId = createAsyncThunk(
  'pdf/set-file-id',
  async ({ fileId }: { fileId?: string } = {}, { getState, rejectWithValue }) => {
    try {
      return fileId;
      // eslint-disable-next-line
    } catch (err: any) {
      return rejectWithValue({
        status: err.response?.status,
        message: err.response?.data?.errorMessage || err.message,
      });
    }
  }
);

export const updateTempTemplate = createAsyncThunk(
  'pdf/update-temp-template',
  async ({ tempTemplate }: { tempTemplate?: PdfTemplate } = {}, { getState, rejectWithValue }) => {
    return tempTemplate;
  }
);

export interface PdfJob {
  operation: string;
  templateId: string;
  data: Record<string, unknown>;
  filename: string;
  urn: string;
  id: string;
  status: string;
  result: unknown | null;
  pdfTemplate: PdfTemplateMap;
  payload: {
    error: string;
  };
}

export interface PdfTemplateMap {
  [templateName: string]: PdfTemplate;
}

export interface PdfTemplate {
  id: string;
  name: string;
  description: string;
  template: string;
  additionalStyles: string;
  header: string;
}

export type PdfJobList = PdfJob[];

interface PdfState {
  socketChannel: Record<string, string> | null;
  busy: {
    loading: boolean;
  };
  pdfFileData: Record<string, string> | null;
  // eslint-disable-next-line
  stream: any[];
  jobs: PdfJobList;
  pdfTemplates: Record<string, PdfTemplate>;
  reloadFile: Record<string, string>;
  tempTemplate: PdfTemplate | null;
  corePdfTemplates: Record<string, PdfTemplate>;
  files: Record<string, string>;
  currentFile: string | null;
  currentId: string;
}

const initialPdfState: PdfState = {
  socketChannel: null,
  busy: {
    loading: false,
  },
  pdfFileData: null,
  stream: [],
  jobs: [],
  pdfTemplates: {},
  reloadFile: {},
  tempTemplate: null,
  corePdfTemplates: {},
  files: {},
  currentFile: null,
  currentId: '',
};

const pdfSlice = createSlice({
  name: PDF_FEATURE_KEY,
  initialState: initialPdfState,
  reducers: {
    setFileData: (state, { payload }: { payload: Record<string, string> }) => {
      state.pdfFileData = payload;
    },
    streamEventReceived(state, action) {
      state.stream.push(action.payload);
    },
    pdfProcessing(state, action) {
      let jobs = JSON.parse(JSON.stringify(state.jobs));
      // eslint-disable-next-line
      let index = jobs.findIndex((job: any) => job.id === action.payload.context?.jobId);

      if (index > -1) {
        if (!jobs[index].stream) {
          jobs[index].stream = [];
        }

        jobs[index].stream.push(action);
        jobs[index].status = action.payload.name;
        jobs[index].payload = { ...action };
      } else {
        if (action?.payload.file?.filename) {
          jobs = [action].concat(jobs);
        }
        index = 0;
      }

      state.reloadFile = { ...state.reloadFile, [state.jobs[index]?.templateId]: action.payload?.payload?.file?.id };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(generatePdf.fulfilled, (state, { payload }) => {
        let jobs = JSON.parse(JSON.stringify(state.jobs));
        const actionKey = payload.pdfTemplate && Object.keys(payload.pdfTemplate)[0];
        const pdfTemplate = state.pdfTemplates;

        if (actionKey) {
          pdfTemplate[actionKey] = payload.pdfTemplate[actionKey];
        }

        // eslint-disable-next-line
        let index = jobs.findIndex((job: any) => job.id === payload.context?.jobId);

        if (index > -1) {
          if (!jobs[index].stream) {
            jobs[index].stream = [];
          }

          jobs[index].stream.push(payload);
          jobs[index].status = payload.name;
          jobs[index].payload = { ...payload };
        } else {
          if (payload?.filename) {
            jobs = [payload].concat(jobs);
          }
          index = 0;
        }

        state.busy.loading = false;
        state.jobs = jobs;
        state.pdfTemplates = { ...pdfTemplate };
      })
      .addCase(generatePdf.rejected, (state, { payload }) => {
        state.busy.loading = false;
      })
      .addCase(generatePdf.pending, (state, { payload }) => {
        state.busy.loading = true;
      })
      .addCase(showCurrentFilePdf.fulfilled, (state, { payload }) => {
        state.files = {
          ...state.files,
          [payload.fileId]: payload.responseFile,
        };
        state.currentFile = payload.responseFile;
        state.currentId = payload.fileId;
        state.busy.loading = false;
      })
      .addCase(showCurrentFilePdf.rejected, (state, { payload }) => {
        state.busy.loading = false;
      })
      .addCase(showCurrentFilePdf.pending, (state, { payload }) => {
        state.busy.loading = true;
      })
      .addCase(getCorePdfTemplates.fulfilled, (state, { payload }) => {
        state.corePdfTemplates = payload;
        state.busy.loading = false;
      })
      .addCase(getCorePdfTemplates.rejected, (state, { payload }) => {
        state.busy.loading = false;
      })
      .addCase(getCorePdfTemplates.pending, (state, { payload }) => {
        state.busy.loading = true;
      })
      .addCase(setPdfDisplayFileId.fulfilled, (state, { payload }) => {
        state.currentId = payload || '';
      })
      .addCase(updateTempTemplate.fulfilled, (state, { payload }) => {
        state.tempTemplate = payload || null;
      });
  },
});

export const pdfActions = pdfSlice.actions;

export const pdfReducer = pdfSlice.reducer;
