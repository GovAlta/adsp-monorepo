import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { RootState } from '..';
import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { ErrorNotification } from '../notifications/actions';
import { getAccessToken } from '../tenant/sagas';
import {
  FetchCalendarsAction,
  fetchCalendarSuccess,
  FETCH_CALENDARS_ACTION,
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
  UpdateSearchCalendarEventCriteriaAndFetchEventsAction,
  FetchEventsByCalendar,
  UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION,
  UpdateSearchCalendarEventCriteria
} from './actions';
import { UpdateElementIndicator } from '../session/actions';
import { UpdateIndicator } from '../session/actions';
import { ActionState } from '../session/models';
import { fetchCalendarApi } from './api';

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
    const url = `${configBaseUrl}/configuration/v2/configuration/platform/calendar-service/latest`;
    const coreUrl = `${configBaseUrl}/configuration/v2/configuration/platform/calendar-service?core`;
    try {
      const { tenant, core } = yield all({
        tenant: call(fetchCalendarApi, token, url),
        core: call(fetchCalendarApi, token, coreUrl),
      });
      const coreConfiguration = core.latest?.configuration;
      yield put(fetchCalendarSuccess({ tenant, core: coreConfiguration }));

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


type CriteriaParse = {
  startsAfter?: string;
  endsBefore?: string;
  recordId?: string;
};

export function* fetchEventsByCalendar(action: FetchEventsByCalendarAction): SagaIterator {
  const calendarBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.calendarServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const calendarName = action.payload;
  const criteria = yield select((state: RootState) => state?.calendar?.eventSearchCriteria);
  if (calendarBaseUrl && token) {
    const params = {};

    if (criteria) {
      const criteriaParse: CriteriaParse = {};

      if (criteria?.startDate) {
        criteriaParse.startsAfter = criteria.startDate;
      }
      if (criteria?.endDate) {
        criteriaParse.endsBefore = criteria.endDate;
      }
      if (criteria?.recordId) {
        criteriaParse.recordId = criteria.recordId;
      }
      params['criteria'] = JSON.stringify(criteriaParse);
    }

    if (action?.after) {
      params['after'] = action?.after;
    }

    try {
      yield put(UpdateElementIndicator({ show: true, id: FETCH_EVENTS_BY_CALENDAR_ACTION }));
      const { data } = yield call(axios.get, `${calendarBaseUrl}/calendar/v1/calendars/${calendarName}/events`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      yield put(FetchEventsByCalendarSuccess(data?.results, calendarName, data?.page?.next, action?.after));
      yield put(UpdateElementIndicator({ show: false, id: null }));
    } catch (err) {
      yield put(UpdateElementIndicator({ show: false, id: null }));
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

  if (action.payload.recordId) {
    action.payload.recordId = `urn:ads:platform:configuration-service:v2:/configuration/form-service/${action.payload.recordId}`;
  }

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

export function* UpdateEventSearchCriteriaAndUpdateEvent(
  action: UpdateSearchCalendarEventCriteriaAndFetchEventsAction
): SagaIterator {
  try {
    yield put(UpdateSearchCalendarEventCriteria(action.payload));
    yield put(FetchEventsByCalendar(action.payload?.calendarName));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}


export function* watchCalendarSagas(): Generator {
  yield takeEvery(FETCH_CALENDARS_ACTION, fetchCalendars);
  yield takeEvery(FETCH_EVENTS_BY_CALENDAR_ACTION, fetchEventsByCalendar);
  yield takeEvery(CREATE_EVENT_CALENDAR_ACTION, CreateEventByCalendar);
  yield takeEvery(DELETE_CALENDAR_EVENT_ACTION, DeleteCalendarEvent);
  yield takeEvery(UPDATE_EVENT_CALENDAR_ACTION, UpdateEventByCalendar);
  yield takeEvery(UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION, UpdateEventSearchCriteriaAndUpdateEvent);
}
