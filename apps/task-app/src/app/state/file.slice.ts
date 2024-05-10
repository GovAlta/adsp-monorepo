import { AdspId } from '@core-services/app-common';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const FILE_FEATURE_KEY = 'file';

interface FileMetadata {
  urn: string;
  filename: string;
  mimeType?: string;
  recordId?: string;
}

const FILE_SERVICE_ID = 'urn:ads:platform:file-service';
async function getFileMetadata(fileServiceUrl: string, urn: string): Promise<FileMetadata> {
  if (!AdspId.isAdspId(urn) || !urn.startsWith(FILE_SERVICE_ID)) {
    throw new Error('Specified urn is not recognized as a file URN.');
  }

  const token = await getAccessToken();
  const { data } = await axios.get<FileMetadata>(
    new URL(`/file/v1/${urn.substring(FILE_SERVICE_ID.length + 4)}`, fileServiceUrl).href,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  return data;
}

export const loadFileMetadata = createAsyncThunk(
  'file/get-file-metadata',
  async (urn: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const fileServiceUrl = config.directory[FILE_SERVICE_ID];

      const metadata = await getFileMetadata(fileServiceUrl, urn);

      return metadata;
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

export const downloadFile = createAsyncThunk(
  'file/download-file',
  async (urn: string, { getState, rejectWithValue }) => {
    try {
      const { config, file: fileState } = getState() as AppState;
      const fileServiceUrl = config.directory[FILE_SERVICE_ID];

      let metadata = fileState.metadata[urn];
      if (!metadata) {
        metadata = await getFileMetadata(fileServiceUrl, urn);
      }

      const token = await getAccessToken();
      const { data, headers } = await axios.get(
        new URL(`/file/v1/${urn.substring(FILE_SERVICE_ID.length + 4)}/download`, fileServiceUrl).href,
        {
          responseType: 'blob',
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const mimeType = headers['content-type']?.toString();

      const file = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(new File([data], metadata.filename, { type: mimeType }));
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });

      return { file, metadata: { ...metadata, mimeType } };
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

interface FileState {
  files: Record<string, string>;
  metadata: Record<string, FileMetadata>;
  busy: {
    download: Record<string, boolean>;
    metadata: Record<string, boolean>;
  };
}

const initialFileState: FileState = {
  files: {},
  metadata: {},
  busy: {
    download: {},
    metadata: {},
  },
};

const fileSlice = createSlice({
  name: FILE_FEATURE_KEY,
  initialState: initialFileState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadFileMetadata.pending, (state, { meta }) => {
        state.busy.metadata[meta.arg] = true;
      })
      .addCase(loadFileMetadata.fulfilled, (state, { meta, payload }) => {
        state.metadata[meta.arg] = payload;
        state.busy.metadata[meta.arg] = false;
      })
      .addCase(loadFileMetadata.rejected, (state, { meta }) => {
        state.busy.metadata[meta.arg] = false;
      })
      .addCase(downloadFile.pending, (state, { meta }) => {
        state.busy.download[meta.arg] = true;
      })
      .addCase(downloadFile.fulfilled, (state, { meta, payload: { file, metadata } }) => {
        state.files[meta.arg] = file;
        state.metadata[meta.arg] = metadata;
        state.busy.download[meta.arg] = false;
      })
      .addCase(downloadFile.rejected, (state, { meta }) => {
        state.busy.download[meta.arg] = false;
      });
  },
});

export const fileReducer = fileSlice.reducer;

export const fileMetadataSelector = createSelector(
  (state: AppState) => state.file.metadata,
  (_state: AppState, urn: string) => urn,
  (metadata, urn) => metadata[urn]
);

export const fileDataUrlSelector = createSelector(
  (state: AppState) => state.file.files,
  (_state: AppState, urn: string) => urn,
  (files, urn) => files[urn]
);

export const fileLoadingSelector = createSelector(
  (state: AppState) => state.file.busy,
  (_state: AppState, urn: string) => urn,
  (busy, urn) => busy.metadata[urn] || busy.download[urn]
);
export const anyFileLoadingSelector = createSelector(
  (state: AppState) => state.file.busy,
  (busy) => !!Object.keys(busy?.download).find((file) => busy?.download[file])
);
