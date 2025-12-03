import { AdspId } from '@core-services/app-common';
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios, { AxiosProgressEvent } from 'axios';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const FILE_FEATURE_KEY = 'file';

export interface FileMetadata {
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
  async ({ urn }: { urn: string; propertyId: string }, { getState, rejectWithValue }) => {
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
      let metadata = undefined;

      for (const propertyId in fileState.metadata) {
        metadata = fileState.metadata[propertyId].find((f) => f.urn === urn);
        if (metadata) {
          break;
        }
      }

      if (!metadata) {
        metadata = await getFileMetadata(fileServiceUrl, urn);
      }

      const token = await getAccessToken();
      const { data, headers } = await axios.get(
        new URL(`/file/v1/${urn.substring(FILE_SERVICE_ID.length + 4)}/download?unsafe=true`, fileServiceUrl).href,
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

      return { file, data, metadata: { ...metadata, mimeType } };
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

export const downloadFormPdf = createAsyncThunk('file/download-form-pdf', async (urn: string, { rejectWithValue }) => {
  try {
    const token = await getAccessToken();
    const { data, headers } = await axios.get(`/api/gateway/v1/file/v1/download?formUrn=${urn}`, {
      responseType: 'blob',
      headers: { Authorization: `Bearer ${token}` },
    });
    const mimeType = headers['content-type']?.toString();

    const file = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(new File([data], 'temp.pdf', { type: mimeType }));
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
    });

    return { file, data, metadata: { mimeType } };
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
});

export const checkPdfFile = createAsyncThunk(
  'file/check-pdf-file',
  async (urn: string, { getState, rejectWithValue }) => {
    try {
      const { user } = getState() as AppState;
      if (user.user) {
        const token = await getAccessToken();
        const { data } = await axios.get(`/api/gateway/v1/file/v1/file?formUrn=${urn}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        return { data };
      } else {
        // TODO: Implement PDF feature for anonymous applications.
        // If the application is anonymous and no logged in user, then skip the file request.
        return {};
      }
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

export const uploadAnonymousFile = createAsyncThunk(
  'file/upload-anonymous-file',
  async (
    { typeId, file }: { typeId: string; file: File; recordId: string; propertyId: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const { config, user } = getState() as AppState;
      const tenantId = user.tenant.id;

      let token: string;
      const grecaptcha = window['grecaptcha'];
      if (grecaptcha?.execute) {
        token = await grecaptcha.execute(config.environment.recaptchaKey, { action: 'submit_form_supporting_doc' });
      }

      const formData = new FormData();
      formData.append('type', typeId);
      formData.append('file', file);
      formData.append('filename', file.name);
      formData.append('tenantId', tenantId);

      const { data: metadata } = await axios.post<FileMetadata>(`/api/gateway/v1/files`, formData, {
        headers: { token },
        params: { tenant: tenantId },
        onUploadProgress: ({ loaded, total }: AxiosProgressEvent) => {
          const progress = Math.floor((loaded * 100) / total);
          dispatch(fileActions.setUploadProgress({ name: file.name, progress }));
        },
      });

      // Keep the file in data URL form in the state, so we don't need to download again.
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });

      return { metadata, file: fileDataUrl };
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

export const uploadFile = createAsyncThunk(
  'file/upload-file',
  async (
    { typeId, file, recordId, propertyId }: { typeId: string; file: File; recordId: string; propertyId: string },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const fileServiceUrl = config.directory[FILE_SERVICE_ID];

      const token = await getAccessToken();
      const formData = new FormData();
      formData.append('type', typeId);
      formData.append('recordId', recordId);
      formData.append('file', file);

      const { data: metadata } = await axios.post<FileMetadata>(
        new URL('/file/v1/files', fileServiceUrl).href,
        formData,
        {
          headers: { Authorization: `Bearer ${token}` },
          onUploadProgress: ({ loaded, total }: AxiosProgressEvent) => {
            const progress = Math.floor((loaded * 100) / total);
            dispatch(fileActions.setUploadProgress({ name: file.name, progress }));
          },
        }
      );

      // Keep the file in data URL form in the state, so we don't need to download again.
      const fileDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => reject(reader.error);
      });

      return { metadata, file: fileDataUrl };
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

export const deleteFile = createAsyncThunk(
  'file/delete-file',
  async (
    { urn, anonymousApply }: { urn: string; propertyId: string; anonymousApply: boolean },
    { getState, rejectWithValue }
  ) => {
    try {
      const { config, file } = getState() as AppState;
      const fileServiceUrl = config.directory[FILE_SERVICE_ID];
      if (anonymousApply === true) {
        return file.metadata[urn];
      }

      const token = await getAccessToken();
      const filePath = urn.split(':').pop();
      const { data } = await axios.delete<{ deleted: boolean }>(new URL(`/file/v1${filePath}`, fileServiceUrl).href, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return data;
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
  pdfFile: string;
  pdfFileExists?: boolean;
  metadata: Record<string, Array<FileMetadata>>;
  upload: { name: string; progress: number };
  busy: {
    download: Record<string, boolean>;
    metadata: Record<string, boolean>;
    uploading: boolean;
    loading: boolean;
  };
}

const initialFileState: FileState = {
  files: {},
  pdfFile: null,
  pdfFileExists: null,
  metadata: {},
  upload: null,
  busy: {
    download: {},
    metadata: {},
    uploading: false,
    loading: false,
  },
};

export interface FileCriteria {
  filenameContains?: string;
  scanned?: boolean;
  deleted?: boolean;
  infected?: boolean;
  typeEquals?: string;
  recordIdEquals?: string;
  recordIdContains?: string;
}

const fileSlice = createSlice({
  name: FILE_FEATURE_KEY,
  initialState: initialFileState,
  reducers: {
    setUploadProgress: (state, { payload }: { payload: { name: string; progress: number } }) => {
      state.upload = payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadFileMetadata.pending, (state, { meta }) => {
        state.busy.metadata[meta.arg.propertyId] = true;
        state.busy.loading = true;
      })
      .addCase(loadFileMetadata.fulfilled, (state, { meta, payload }) => {
        state.metadata[meta.arg.propertyId] = [...(state.metadata?.[meta.arg.propertyId] || []), payload];

        state.busy.loading = false;
        state.busy.metadata[meta.arg.propertyId] = false;
      })
      .addCase(loadFileMetadata.rejected, (state, { meta }) => {
        state.busy.metadata[meta.arg.propertyId] = false;
        state.busy.loading = false;
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
      })
      .addCase(downloadFormPdf.pending, (state, { meta }) => {
        state.busy.download[meta.arg] = true;
      })
      .addCase(downloadFormPdf.fulfilled, (state, { meta, payload: { file } }) => {
        state.pdfFile = file;
        state.busy.download[meta.arg] = false;
      })
      .addCase(downloadFormPdf.rejected, (state, { meta }) => {
        state.busy.download[meta.arg] = false;
      })
      .addCase(checkPdfFile.pending, (state, { meta }) => {
        state.busy.download[meta.arg] = true;
      })
      .addCase(checkPdfFile.fulfilled, (state, { meta, payload: { data } }) => {
        state.pdfFileExists = !!data?.fileId;
        state.busy.download[meta.arg] = false;
      })
      .addCase(checkPdfFile.rejected, (state, { meta }) => {
        state.busy.download[meta.arg] = false;
      })
      .addCase(uploadFile.pending, (state, { meta }) => {
        state.busy.uploading = true;
        state.upload = { name: meta.arg.file.name, progress: 0 };
      })
      .addCase(uploadFile.fulfilled, (state, { meta, payload }) => {
        state.busy.uploading = false;
        state.files[payload.metadata.urn] = payload.file;
        state.metadata[meta.arg.propertyId] = [...(state.metadata?.[meta.arg.propertyId] || []), payload.metadata];
      })
      .addCase(uploadFile.rejected, (state) => {
        state.busy.uploading = false;
      })
      .addCase(uploadAnonymousFile.pending, (state, { meta }) => {
        state.busy.uploading = true;
        state.upload = { name: meta.arg.file.name, progress: 0 };
      })
      .addCase(uploadAnonymousFile.fulfilled, (state, { meta, payload }) => {
        state.busy.uploading = false;
        state.files[payload.metadata.urn] = payload.file;
        state.metadata[meta.arg.propertyId] = [...(state.metadata?.[meta.arg.propertyId] || []), payload.metadata];
      })
      .addCase(uploadAnonymousFile.rejected, (state) => {
        state.busy.uploading = false;
      })
      .addCase(deleteFile.fulfilled, (state, { meta }) => {
        state.files[meta.arg.urn] = null;
        const propertyIdRoot = meta.arg.propertyId.split('.')?.[0];
        state.metadata[propertyIdRoot] = state.metadata[propertyIdRoot].filter((f) => f.urn !== meta.arg.urn);
        if (state.metadata[propertyIdRoot].length === 0) {
          delete state.metadata[propertyIdRoot];
        }
        state.busy.loading = false;
      });
  },
});

const fileActions = fileSlice.actions;

export const fileReducer = fileSlice.reducer;
export const metaDataSelector = (state: AppState) => state.file.metadata;

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
export const checkExistingPdfFile = createSelector(
  (state: AppState) => state.file.pdfFileExists,
  (file) => file
);

export const fileMetaDataSelector = (state: AppState) => state.file.metadata;
export const fileBusySelector = (state: AppState) => state.file.busy;

export const fileLoadingSelector = createSelector(
  (state: AppState) => state.file.busy,
  (_state: AppState, urn: string) => urn,
  (busy, urn) => busy.metadata[urn] || busy.download[urn]
);
