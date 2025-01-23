import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { DIRECTORY_SERVICE_ID, PagedResults } from './types';
import { getAccessToken } from './user.slice';
import type { AppState } from './store';

export const DIRECTORY_FEATURE_KEY = 'directory';

export interface Resource {
  urn: string;
  name: string;
  description: string;
  type: string;
}

export interface Tag {
  value: string;
  label: string;
}

interface DirectoryState {
  resources: Record<string, Resource>;
  tags: Record<string, Tag>;
  resourceTags: Record<string, string[]>;
  tagResources: Record<string, string[]>;
  results: string[];
  next: string;
  busy: {
    loading: boolean;
    loadingResourceTags: Record<string, boolean>;
    executing: boolean;
  };
}

const initialState: DirectoryState = {
  resources: {},
  tags: {},
  resourceTags: {},
  tagResources: {},
  results: [],
  next: null,
  busy: {
    loading: false,
    loadingResourceTags: {},
    executing: false,
  },
};

export const getTags = createAsyncThunk(
  'directory/get-tags',
  async ({ after }: { after?: string }, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const directoryServiceUrl = config.directory[DIRECTORY_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.get<PagedResults<Tag>>(new URL(`/resource/v1/tags`, directoryServiceUrl).href, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          top: 50,
          after,
        },
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

export const getTaggedResources = createAsyncThunk(
  'directory/get-tagged-resources',
  async ({ value, after }: { value: string; after?: string }, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const directoryServiceUrl = config.directory[DIRECTORY_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.get<PagedResults<Resource>>(
        new URL(`/resource/v1/tags/${value}/resources`, directoryServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            top: 50,
            after,
          },
        }
      );

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

export const getResourceTags = createAsyncThunk(
  'directory/get-resource-tags',
  async ({ urn, after }: { urn: string; after?: string }, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const directoryServiceUrl = config.directory[DIRECTORY_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.get<PagedResults<Tag>>(new URL('/resource/v1/tags', directoryServiceUrl).href, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          top: 50,
          after,
          resource: urn,
        },
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

export const tagResource = createAsyncThunk(
  'directory/tag-resource',
  async ({ urn, label }: { urn: string; label: string }, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const directoryServiceUrl = config.directory[DIRECTORY_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.post<{ tagged: boolean; tag: Tag; resource: Resource }>(
        new URL('/resource/v1/tags', directoryServiceUrl).href,
        { operation: 'tag-resource', resource: { urn }, tag: { label } },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

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

export const untagResource = createAsyncThunk(
  'directory/untag-resource',
  async ({ urn, tag }: { urn: string; tag: Tag }, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const directoryServiceUrl = config.directory[DIRECTORY_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.post<{ untagged: boolean; tag: Tag; resource: Resource }>(
        new URL('/resource/v1/tags', directoryServiceUrl).href,
        { operation: 'untag-resource', resource: { urn }, tag },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

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

const directorySlice = createSlice({
  name: DIRECTORY_FEATURE_KEY,
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getTags.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(getTags.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(getTags.fulfilled, (state, { payload, meta }) => {
        state.busy.loading = false;
        state.results = [...(meta.arg.after ? state.results : []), ...payload.results.map(({ value }) => value)];
        for (const result of payload.results) {
          state.tags[result.value] = result;
        }
        state.next = payload.page.next;
      })
      .addCase(getTaggedResources.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(getTaggedResources.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(getTaggedResources.fulfilled, (state, { payload, meta }) => {
        state.busy.loading = false;
        const resourceUrns = payload.results.map((result) => result.urn);
        state.results = [...(meta.arg.after ? state.results : []), ...resourceUrns];
        for (const result of payload.results) {
          state.resources[result.urn] = result;
          state.tagResources[meta.arg.value] = [
            ...(meta.arg.after ? state.tagResources[meta.arg.value] || [] : []),
            ...resourceUrns,
          ];
        }
        state.next = payload.page.next;
      })
      .addCase(getResourceTags.pending, (state, { meta }) => {
        state.busy.loadingResourceTags[meta.arg.urn] = true;
      })
      .addCase(getResourceTags.rejected, (state, { meta }) => {
        state.busy.loadingResourceTags[meta.arg.urn] = false;
      })
      .addCase(getResourceTags.fulfilled, (state, { payload, meta }) => {
        state.busy.loadingResourceTags[meta.arg.urn] = false;

        const tagValues = payload.results.map((result) => result.value);
        state.results = [...(meta.arg.after ? state.results : []), ...tagValues];
        state.next = payload.page.next;
        state.resourceTags[meta.arg.urn] = [
          ...(meta.arg.after ? state.resourceTags[meta.arg.urn] || [] : []),
          ...tagValues,
        ];
        state.tags = {
          ...state.tags,
          ...payload.results.reduce((tags, result) => ({ ...tags, [result.value]: result }), {}),
        };
      })
      .addCase(tagResource.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(tagResource.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(tagResource.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.resources[payload.resource.urn] = {
          ...state.resources[payload.resource.urn],
          ...payload.resource,
        };

        state.tags[payload.tag.value] = {
          ...state.tags[payload.tag.value],
          ...payload.tag,
        };

        if (!state.resourceTags[payload.resource.urn]?.includes(payload.tag.value)) {
          state.resourceTags[payload.resource.urn] = [
            ...(state.resourceTags[payload.resource.urn] || []),
            payload.tag.value,
          ];
        }

        if (!state.tagResources[payload.tag.value]?.includes(payload.resource.urn)) {
          state.tagResources[payload.tag.value] = [
            ...(state.tagResources[payload.tag.value] || []),
            payload.resource.urn,
          ];
        }
      })
      .addCase(untagResource.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(untagResource.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(untagResource.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.resources[payload.resource.urn] = {
          ...state.resources[payload.resource.urn],
          ...payload.resource,
        };

        state.tags[payload.tag.value] = {
          ...state.tags[payload.tag.value],
          ...payload.tag,
        };

        const tagIndex = state.resourceTags[payload.resource.urn]?.indexOf(payload.tag.value);
        if (tagIndex >= 0) {
          state.resourceTags[payload.resource.urn].splice(tagIndex, 1);
        }

        const resourceIndex = state.tagResources[payload.tag.value]?.indexOf(payload.resource.urn);
        if (resourceIndex >= 0) {
          state.tagResources[payload.tag.value].splice(resourceIndex, 1);
        }
      });
  },
});

export const directoryReducer = directorySlice.reducer;
export const directoryActions = directorySlice.actions;

export const tagsSelector = createSelector(
  (state: AppState) => state.directory.tags,
  (tags) => Object.values(tags).sort((a, b) => a.label.localeCompare(b.label))
);

export const resourceTagsSelector = createSelector(
  (state: AppState) => state.directory.tags,
  (state: AppState, urn: string) => state.directory.resourceTags[urn],
  (tags, resourceTags) => resourceTags?.map((tag) => tags[tag])
);

export const directoryBusySelector = (state: AppState) => state.directory.busy;
