import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios, { AxiosError } from 'axios';
import { AppState } from '../store';

import { CalendarEvent, CONFIGURATION_SERVICE_ID } from '../types';
import { getAccessToken } from '../user/user.slice';
import { getLocalISOString } from '../../utils/timeUtil';

export const CALENDAR_FEATURE_KEY = 'calendar';

export interface CalendarTemplate {
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

export interface CalendarEventSearchCriteria {
  startDate?: string;
  endDate?: string;
  calendarName?: string;
  recordId?: string;
}

export const getDefaultSearchCriteria = (): CalendarEventSearchCriteria => {
  const start = new Date();
  start.setHours(24, 0, 0, 0);
  const end = new Date();
  end.setHours(24, 0, 0, 0);

  return {
    // using absolute unit time will be more intuitive than using setDate;
    startDate: new Date(start.valueOf() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    endDate: end.toISOString(),
  };
};

export const CalendarEventDefault = {
  id: null,
  name: '',
  description: '',
  start: getLocalISOString(new Date()),
  end: getLocalISOString(new Date()),
  isPublic: false,
  isAllDay: false,
  recordId: '',
};

const CALENDAR_SERVICE_ID = 'urn:ads:platform:calendar-service';

export const UpdateEventByCalendar = createAsyncThunk(
  'calendar/update-event',
  async (payload: { calendarName: string; eventId: string; payload: CalendarEvent }, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const calendarBaseUrl = state.config.directory[CALENDAR_SERVICE_ID];
    const token = await getAccessToken();

    if (!(token && calendarBaseUrl)) {
      return rejectWithValue({
        message: 'Missing configuration URLs or token',
      });
    }

    try {
      const response = await axios.patch(
        `${calendarBaseUrl}/calendar/v1/calendars/${payload.calendarName}/events/${payload.eventId}`,
        payload.payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      }

      return rejectWithValue({
        status: undefined,
        message: 'Unexpected error occurred',
      });
    }
  }
);

export const CreateEventByCalendar = createAsyncThunk(
  'calendar/create-event',
  async (payload: { payload: CalendarEvent }, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const calendarBaseUrl = state.config.directory[CALENDAR_SERVICE_ID];
    const token = await getAccessToken();

    if (!(token && calendarBaseUrl)) {
      return rejectWithValue({
        message: 'Missing configuration URLs or token',
      });
    }

    try {
      const response = await axios.post(
        `${calendarBaseUrl}/calendar/v1/calendars/form-intake/events`,
        payload.payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      return response.data;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      }

      return rejectWithValue({
        status: undefined,
        message: 'Unexpected error occurred',
      });
    }
  }
);

export const DeleteCalendarEvent = createAsyncThunk(
  'calendar/delete-event',
  async (payload: { eventId: string }, { getState, rejectWithValue }) => {
    const state = getState() as AppState;
    const calendarBaseUrl = state.config.directory[CALENDAR_SERVICE_ID];
    const token = await getAccessToken();

    if (!(token && calendarBaseUrl)) {
      return rejectWithValue({
        message: 'Missing configuration URLs or token',
      });
    }

    try {
      await axios.delete(`${calendarBaseUrl}/calendar/v1/calendars/form-intake/events/${payload.eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      return payload;
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      }

      return rejectWithValue({
        status: undefined,
        message: 'Unexpected error occurred',
      });
    }
  }
);

export const fetchCalendar = createAsyncThunk(
  'calendar/fetch-events',
  async (
    payload: {
      criteria: CalendarEventSearchCriteria;
    },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as AppState;

      const { criteria } = payload;

      let currentCriteria = criteria;

      if (!currentCriteria) {
        currentCriteria = getDefaultSearchCriteria();
      }
      const baseUrl = state.config.directory[CONFIGURATION_SERVICE_ID];
      const calendarBaseUrl = state.config.directory[CALENDAR_SERVICE_ID];

      const token = await getAccessToken();

      if (!(token && baseUrl)) {
        return rejectWithValue({
          message: 'Missing configuration URLs or token',
        });
      }

      const fetchUrl = `${calendarBaseUrl}/calendar/v1/calendars/form-intake/events`;
      const response = await axios.get(fetchUrl, { headers: { Authorization: `Bearer ${token}` } });
      const responseData = response.data?.results;

      return { data: responseData };
      // eslint-disable-next-line
    } catch (err: unknown) {
      if (err instanceof AxiosError) {
        return rejectWithValue({
          status: err.response?.status,
          message: err.response?.data?.errorMessage || err.message,
        });
      }

      return rejectWithValue({
        status: undefined,
        message: 'Unexpected error occurred',
      });
    }
  }
);

interface CalendarState {
  formIntakeCalendar: CalendarEvent[];
  busy: {
    loading: boolean;
  };
  criteria: CalendarEventSearchCriteria;
}

const initialCalendarState: CalendarState = {
  formIntakeCalendar: [],
  busy: {
    loading: false,
  },
  criteria: {},
};

const calendarSlice = createSlice({
  name: CALENDAR_FEATURE_KEY,
  initialState: initialCalendarState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendar.fulfilled, (state, { payload }) => {
        const CurrentFormIntakeCalendar = payload;

        state.formIntakeCalendar = CurrentFormIntakeCalendar.data;

        state.busy.loading = false;
      })
      .addCase(fetchCalendar.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(fetchCalendar.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(DeleteCalendarEvent.fulfilled, (state, { payload }) => {
        const index = state.formIntakeCalendar.findIndex((calendar) => calendar.id?.toString() === payload.eventId);

        if (index !== -1) {
          state.formIntakeCalendar.splice(index, 1);
        }
        state.busy.loading = false;
      })
      .addCase(DeleteCalendarEvent.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(DeleteCalendarEvent.pending, (state) => {
        state.busy.loading = true;
      })
      .addCase(CreateEventByCalendar.fulfilled, (state, { payload }) => {
        state.formIntakeCalendar.push(payload);
        state.busy.loading = false;
      })
      .addCase(CreateEventByCalendar.rejected, (state) => {
        state.busy.loading = false;
      })
      .addCase(CreateEventByCalendar.pending, (state) => {
        state.busy.loading = true;
      });
  },
});

export const calendarActions = calendarSlice.actions;

export const calendarReducer = calendarSlice.reducer;
