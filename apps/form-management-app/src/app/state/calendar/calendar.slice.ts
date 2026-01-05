import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';
import { AppState } from '../store';
import { CONFIGURATION_SERVICE_ID } from '../types';
import { getAccessToken } from '../user/user.slice';

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




const CALENDAR_SERVICE_ID = 'urn:ads:platform:calendar-service';





export const fetchCalendar = createAsyncThunk(
  'calendar/fetch-events',
  async (
    payload: {
      calendarName: string;
      criteria: CalendarEventSearchCriteria;
    },
    { getState, dispatch, rejectWithValue }
  ) => {
    try {
      const state = getState() as AppState;

      const { calendarName, criteria } = payload;

      let currentCriteria = criteria;

      if (!currentCriteria) {
        currentCriteria = getDefaultSearchCriteria();
      }
      const baseUrl = state.config.directory[CONFIGURATION_SERVICE_ID];
      const calendarBaseUrl = state.config.directory[CALENDAR_SERVICE_ID];
      console.log(JSON.stringify(calendarBaseUrl))
  
      const token = await getAccessToken();

      if (!(token && baseUrl)) {
        return rejectWithValue({
          message: 'Missing configuration URLs or token',
        });
      }





      const fetchUrl = `${calendarBaseUrl}/calendar/v1/calendars/${calendarName}/events`;

      const response = await axios.get(fetchUrl, { headers: { Authorization: `Bearer ${token}` } });

      console.log(JSON.stringify(response) +"<response")
      console.log(JSON.stringify(response.data) +"<response.data");

      const responseData = response.data;


      return {data: responseData, calendarName: calendarName };
      // eslint-disable-next-line
    } catch (err: any) {
      return rejectWithValue({
        status: err.response?.status,
        message: err.response?.data?.errorMessage || err.message,
      });
    }
  }
);




interface CalendarState {
  formIntakeCalendar: Record<string, string>;
  busy: {
    loading: boolean;
  };
  criteria: CalendarEventSearchCriteria
 
}

const initialCalendarState: CalendarState = {
  formIntakeCalendar: {},
  busy: {
    loading: false,
  },
};

const calendarSlice = createSlice({
  name: CALENDAR_FEATURE_KEY,
  initialState: initialCalendarState,
  reducers: {
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalendar.fulfilled, (state, { payload }) => {
        const CurrentFormIntakeCalendar = payload;

        state.formIntakeCalendar[payload.calendarName] = CurrentFormIntakeCalendar.data;
       
        state.busy.loading = false;
      })
      .addCase(fetchCalendar.rejected, (state, { payload }) => {
        state.busy.loading = false;
      })
      .addCase(fetchCalendar.pending, (state, { payload }) => {
        state.busy.loading = true;
      })
     
  },
});

export const calendarActions = calendarSlice.actions;

export const calendarReducer = calendarSlice.reducer;
