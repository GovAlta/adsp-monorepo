import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { DateTime } from 'luxon';
import { CALENDAR_SERVICE_ID, CalendarEvent, PagedResults } from './types';
import { getAccessToken } from './user.slice';
import { AdspId } from '../../lib/adspId';
import type { AppState } from './store';

export const CALENDAR_FEATURE_KEY = 'calendar';

interface CalendarEventCriteria {
  recordId?: string;
  startsAfter?: string;
  activeOn?: string;
}

interface CalendarState {
  busy: {
    loading: boolean;
    executing: boolean;
  };
  events: Record<string, CalendarEvent>;
  results: string[];
  next: string;
}

const initialCalendarState: CalendarState = {
  busy: {
    loading: false,
    executing: false,
  },
  events: {},
  results: [],
  next: null,
};

export const getEvents = createAsyncThunk(
  'calendar/get-events',
  async (
    { calendar, criteria, after }: { calendar: string; criteria: CalendarEventCriteria; after?: string },
    { getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const calendarServiceUrl = config.directory[CALENDAR_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.get<PagedResults<CalendarEvent>>(
        new URL(`/calendar/v1/calendars/${calendar}/events`, calendarServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: {
            top: 5,
            after,
            criteria: JSON.stringify(criteria),
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

export const deleteEvent = createAsyncThunk(
  'calendar/delete-event',
  async (urn: string, { getState, rejectWithValue }) => {
    try {
      const { config } = getState() as AppState;
      const calendarServiceUrl = config.directory[CALENDAR_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.delete<{ deleted: boolean }>(
        new URL(`/calendar/v1${AdspId.parse(urn).resource}`, calendarServiceUrl).href,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
        }
      );

      return data.deleted;
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

export const createEvent = createAsyncThunk(
  'calendar/create-event',
  async (
    {
      recordId,
      start,
      end,
      name,
      description,
    }: Omit<CalendarEvent, 'urn' | 'id' | 'start' | 'end'> & { start: Date; end?: Date },
    { getState, rejectWithValue }
  ) => {
    try {
      const { config } = getState() as AppState;
      const calendarServiceUrl = config.directory[CALENDAR_SERVICE_ID];
      const accessToken = await getAccessToken();

      const { data } = await axios.post<CalendarEvent>(
        new URL('/calendar/v1/calendars/form-intake/events', calendarServiceUrl).href,
        {
          recordId,
          start: start.toISOString(),
          end: end?.toISOString(),
          name,
          description,
        },
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

const calendarSlice = createSlice({
  name: CALENDAR_FEATURE_KEY,
  initialState: initialCalendarState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getEvents.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(getEvents.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(getEvents.fulfilled, (state, { payload }) => {
        state.busy.loading = false;
        state.events = payload.results.reduce(
          (events, result) => ({
            ...events,
            [result.urn]: result,
          }),
          state.events as Record<string, CalendarEvent>
        );
        state.results = payload.results.map(({ urn }) => urn);
      })
      .addCase(deleteEvent.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(deleteEvent.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(deleteEvent.fulfilled, (state, { meta }) => {
        state.busy.executing = false;
        delete state.events[meta.arg];
      })
      .addCase(createEvent.pending, (state) => {
        state.busy.executing = true;
      })
      .addCase(createEvent.rejected, (state) => {
        state.busy.executing = false;
      })
      .addCase(createEvent.fulfilled, (state, { payload }) => {
        state.busy.executing = false;
        state.events[payload.urn] = payload;
      });
  },
});

export const calendarReducer = calendarSlice.reducer;

export const calendarActions = calendarSlice.actions;

export const recordEventsSelector = createSelector(
  (state: AppState) => state.calendar.events,
  (_: AppState, recordId: string) => recordId,
  (events, recordId) =>
    Object.values(events)
      .filter((event) => recordId === event.recordId)
      .map(({ start, end, ...event }) => ({
        ...event,
        start: start && DateTime.fromISO(start),
        end: end && DateTime.fromISO(end),
      }))
      .sort((a, b) => (a.start < b.start ? -1 : 1))
);

export const calendarBusySelector = (state: AppState) => state.calendar.busy;
