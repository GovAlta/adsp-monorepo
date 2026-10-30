import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from './store';
import { getAccessToken } from './user.slice';

export const CALENDAR_FEATURE_KEY = 'calendar';
export const CALENDAR_SERVICE_ID = 'urn:ads:platform:calendar-service';

export interface CalendarDefinition {
  urn: string;
  name: string;
  displayName: string;
  description?: string;
  source?: 'tenant' | 'core';
}

interface CalendarState {
  calendars: CalendarDefinition[];
  busy: {
    loading: boolean;
  };
}

export const loadCalendars = createAsyncThunk(
  'calendar/load-calendars',
  async ({ tenantName }: { tenantName?: string } = {}, { getState, rejectWithValue }) => {
    const { config } = getState() as AppState;
    const calendarServiceUrl = config.directory[CALENDAR_SERVICE_ID];

    try {
      const token = await getAccessToken().catch(() => null);
      const { data } = await axios.get<CalendarDefinition[]>(
        new URL('/calendar/v1/calendars', calendarServiceUrl).href,
        {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          params: tenantName ? { tenant: tenantName } : undefined,
        },
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
  },
);

const initialCalendarState: CalendarState = {
  calendars: [],
  busy: {
    loading: false,
  },
};

const calendarSlice = createSlice({
  name: CALENDAR_FEATURE_KEY,
  initialState: initialCalendarState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loadCalendars.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(loadCalendars.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.calendars = payload;
      })
      .addCase(loadCalendars.rejected, (state) => {
        state.busy.loading = false;
      });
  },
});

export const calendarReducer = calendarSlice.reducer;

export const calendarsSelector = createSelector(
  (state: AppState) => state.calendar.calendars,
  (calendars) => [...calendars].sort((a, b) => a.name.localeCompare(b.name)),
);

export const calendarsBusySelector = (state: AppState) => state.calendar.busy;
