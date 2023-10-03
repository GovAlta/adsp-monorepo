import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { RootState } from '..';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';

import { getAccessToken } from '@store/tenant/sagas';
import {
  FetchCalendarsAction,
  UpdateCalendarAction,
  fetchCalendarSuccess,
  UpdateCalendarSuccess,
  FETCH_CALENDARS_ACTION,
  UPDATE_CALENDAR_ACTION,
  DeleteCalendarAction,
  DeleteCalendarSuccess,
  DELETE_CALENDAR_ACTION,
  UpdateIndicator,
  FetchEventsByCalendarAction,
  FETCH_EVENTS_BY_CALENDAR_ACTION,
  FetchEventsByCalendarSuccess,
  CreateEventsByCalendarAction,
  CREATE_EVENT_CALENDAR_ACTION,
  CreateEventsByCalendarSuccess,
  DeleteCalendarEventAction,
  DeleteCalendarEventSuccess,
  DELETE_CALENDAR_EVENT_ACTION,
  UpdateEventsByCalendarAction,
  UPDATE_EVENT_CALENDAR_ACTION,
  UpdateEventsByCalendarSuccess,
} from './actions';
import { UpdateElementIndicator } from '@store/session/actions';

import { ActionState } from '@store/session/models';

export function* fetchCalendars(action: FetchCalendarsAction): SagaIterator {
  const details = {};
  details[action.type] = ActionState.inProcess;
  yield put(
    UpdateIndicator({
      details,
    })
  );
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const { data } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/calendar-service/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(fetchCalendarSuccess(data));

      details[action.type] = ActionState.completed;
      yield put(
        UpdateIndicator({
          details,
        })
      );
    } catch (err) {
      yield put(
        ErrorNotification({
          error: err,
        })
      );
      details[action.type] = ActionState.error;
      yield put(
        UpdateIndicator({
          details,
        })
      );
    }
  }
}

export function* updateCalendar({ payload }: UpdateCalendarAction): SagaIterator {
  const calendar = { [payload.name]: { ...payload } };
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  if (configBaseUrl && token) {
    try {
      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/calendar-service`,
        {
          operation: 'UPDATE',
          updatex: { ...calendar },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(
        UpdateCalendarSuccess({
          ...latest.configuration,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

function* deleteCalendar(action: DeleteCalendarAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const calendarId = action.calendarId;

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/calendar-service`,
        { operation: 'DELETE', property: calendarId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(DeleteCalendarSuccess(calendarId));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* fetchEventsByCalendar(action: FetchEventsByCalendarAction): SagaIterator {
  const calendarBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.calendarServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const calendarName = action.payload;

  if (calendarBaseUrl && token) {
    const params = {};

    if (action?.after) {
      params['after'] = action?.after;
    }

    try {
      yield put(UpdateElementIndicator({ show: true, id: FETCH_EVENTS_BY_CALENDAR_ACTION }));
      const { data } = yield call(axios.get, `${calendarBaseUrl}/calendar/v1/calendars/${calendarName}/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      yield put(FetchEventsByCalendarSuccess(data?.results, calendarName, data?.page?.next));
      yield put(UpdateElementIndicator({ show: false, id: null }));
    } catch (err) {
      yield put(UpdateElementIndicator({ show: false, id: null }));
      console.log(JSON.stringify(err) + '<err');
      console.log(JSON.stringify(err.response) + '<err.response');
      console.log(err.response?.data?.errorMessage);
      console.log(err.response.status);
      console.log(err.response.headers);
      yield put(
        ErrorNotification({
          error: err,
        })
      );
    }
  }
}

export function* CreateEventByCalendar(action: CreateEventsByCalendarAction): SagaIterator {
  const calendarBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.calendarServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const calendarId = action.calendarName;
  if (calendarBaseUrl && token) {
    try {
      const response = yield call(
        axios.post,
        `${calendarBaseUrl}/calendar/v1/calendars/${calendarId}/events`,
        action.payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(CreateEventsByCalendarSuccess(calendarId, response.data));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* DeleteCalendarEvent(action: DeleteCalendarEventAction): SagaIterator {
  const calendarBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.calendarServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const eventId = action.eventId;
  const calendarName = action.calendarName;
  if (calendarBaseUrl && token) {
    try {
      yield call(axios.delete, `${calendarBaseUrl}/calendar/v1/calendars/${calendarName}/events/${eventId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(DeleteCalendarEventSuccess(eventId, calendarName));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* UpdateEventByCalendar(action: UpdateEventsByCalendarAction): SagaIterator {
  const calendarBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.calendarServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const calendarId = action.calendarName;
  if (calendarBaseUrl && token) {
    try {
      const response = yield call(
        axios.patch,
        `${calendarBaseUrl}/calendar/v1/calendars/${calendarId}/events/${action.eventId}`,
        action.payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(UpdateEventsByCalendarSuccess(calendarId, action.eventId, response.data));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* watchCalendarSagas(): Generator {
  yield takeEvery(FETCH_CALENDARS_ACTION, fetchCalendars);
  yield takeEvery(UPDATE_CALENDAR_ACTION, updateCalendar);
  yield takeEvery(DELETE_CALENDAR_ACTION, deleteCalendar);
  yield takeEvery(FETCH_EVENTS_BY_CALENDAR_ACTION, fetchEventsByCalendar);
  yield takeEvery(CREATE_EVENT_CALENDAR_ACTION, CreateEventByCalendar);
  yield takeEvery(DELETE_CALENDAR_EVENT_ACTION, DeleteCalendarEvent);
  yield takeEvery(UPDATE_EVENT_CALENDAR_ACTION, UpdateEventByCalendar);
}
