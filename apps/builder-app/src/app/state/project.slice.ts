import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { createTarArchive, gzipBlob, type WorkspaceSnapshotFile } from '../lib/builderWorkspace';
import { getAccessToken } from './user.slice';
import { agentActions } from './agent.slice';
import { AppState } from './store';

export const PROJECT_FEATURE_KEY = 'project';

const BUILDER_PROJECT_FILE_TYPE = 'builder-project';

interface ProjectState {
  isSaving: boolean;
}

const initialState: ProjectState = {
  isSaving: false,
};

// --- Thunks ---

export const saveWorkspaceToFileService = createAsyncThunk(
  'project/saveWorkspace',
  async ({ files, threadId }: { files: WorkspaceSnapshotFile[]; threadId: string }, { getState, dispatch }) => {
    const state = getState() as AppState;
    const tenant = state.user.tenant;
    const config = state.config;
    const fileServiceUrl = config.directory['urn:ads:platform:file-service'];

    if (!tenant || !fileServiceUrl) {
      throw new Error('Missing tenant context or file service URL');
    }

    dispatch(agentActions.setWorkspaceStatus('Preparing workspace for save'));

    const token = await getAccessToken(dispatch, tenant.realm, config);
    if (!token) {
      throw new Error('Authentication required');
    }

    const tar = createTarArchive(files);
    const archive = await gzipBlob(tar);
    const fileName = `builder-project-${threadId}.tar.gz`;
    const formData = new FormData();
    formData.append('type', BUILDER_PROJECT_FILE_TYPE);
    formData.append('recordId', threadId);
    formData.append('filename', fileName);
    formData.append('file', archive, fileName);

    const filesUrl = new URL('/file/v1/files', fileServiceUrl);
    filesUrl.searchParams.set('tenantId', tenant.id);

    const response = await fetch(filesUrl.toString(), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Upload failed (${response.status})`);
    }

    const uploaded = (await response.json()) as { id?: string };
    dispatch(
      agentActions.setWorkspaceStatus(
        uploaded.id
          ? `Workspace saved to file-service (${uploaded.id})`
          : `Workspace saved to file-service (${files.length} files)`,
      ),
    );
    return uploaded;
  },
);

export const lookupProjectSnapshot = createAsyncThunk(
  'project/lookupSnapshot',
  async ({ threadId }: { threadId: string }, { getState, dispatch }): Promise<string | null> => {
    const state = getState() as AppState;
    const tenant = state.user.tenant;
    const config = state.config;
    const fileServiceUrl = config.directory['urn:ads:platform:file-service'];

    if (!tenant || !fileServiceUrl) {
      return null;
    }

    dispatch(agentActions.setWorkspaceStatus('Checking for saved workspace snapshot'));

    const token = await getAccessToken(dispatch, tenant.realm, config);
    if (!token) {
      return null;
    }

    const url = new URL('/file/v1/files', fileServiceUrl);
    url.searchParams.set(
      'criteria',
      JSON.stringify({ typeEquals: BUILDER_PROJECT_FILE_TYPE, recordIdEquals: threadId }),
    );
    url.searchParams.set('top', '1');

    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      return null;
    }

    const { results } = (await res.json()) as { results: { id: string }[] };
    return results?.[0]?.id ?? null;
  },
);

// --- Slice ---

const projectSlice = createSlice({
  name: PROJECT_FEATURE_KEY,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(saveWorkspaceToFileService.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(saveWorkspaceToFileService.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(saveWorkspaceToFileService.rejected, (state) => {
        state.isSaving = false;
      });
  },
});

export const projectReducer = projectSlice.reducer;

export const projectIsSavingSelector = (state: AppState): boolean => state.project.isSaving;
