import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from './store';

import { getAccessToken } from './user.slice';
import { io } from 'socket.io-client';

export const PDF_FEATURE_KEY = 'pdf';

export interface PdfFileMetadata {
  urn: string;
  filename: string;
  mimeType?: string;
  recordId?: string;
}

const PUSH_SERVICE_ID = 'urn:ads:platform:push-service';

let socket;

function connectSocket(pushServiceUrl, tenantId, token, jobId, dispatch) {
  if (!socket || !socket.connected) {
    socket = io(`${pushServiceUrl}`, {
      query: {
        stream: 'pdf-generation-updates',
      },
      path: '/socket.io',
      withCredentials: true,
      extraHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });

    socket.on('pdf-service:pdf-generated', (pdfEvent) => {
      if (pdfEvent?.context?.jobId === jobId) {
        dispatch(pdfActions.setFileData(pdfEvent));
      }
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
    });
  }
}

function disconnectSocket() {
  if (socket && socket.connected) {
    socket.disconnect();
    socket = null;
  }
}

export const connectPdfStream = createAsyncThunk(
  'pdf/connect-stream',
  async (jobId: string, { getState, rejectWithValue, dispatch }) => {
    try {
      const { config, user } = getState() as AppState;
      const tenantId = user.tenant.id;

      const pushServiceUrl = `${config.directory[PUSH_SERVICE_ID]}`;
      const token = await getAccessToken();

      connectSocket(pushServiceUrl, tenantId, token, jobId, dispatch);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      } else {
        throw err;
      }
    }
  }
);

export const disconnectPdfStream = createAsyncThunk('pdf/disconnect-stream', async () => {
  disconnectSocket();
});

interface PdfState {
  socketChannel: Record<string, string>;
  busy: {
    loading: boolean;
  };
  pdfFileData: Record<string, string>;
}

const initialFileState: PdfState = {
  socketChannel: null,
  busy: {
    loading: false,
  },
  pdfFileData: null,
};

const pdfSlice = createSlice({
  name: PDF_FEATURE_KEY,
  initialState: initialFileState,
  reducers: {
    setFileData: (state, { payload }: { payload: Record<string, string> }) => {
      state.pdfFileData = payload;
    },
  },
});

const pdfActions = pdfSlice.actions;

export const pdfReducer = pdfSlice.reducer;

export const checkPdfFileSelector = createSelector(
  (state: AppState) => state.pdf.pdfFileData,
  (pdf) => pdf
);

export const getSocketChannel = createSelector(
  (state: AppState) => state.pdf.socketChannel,
  (pdf) => pdf
);
