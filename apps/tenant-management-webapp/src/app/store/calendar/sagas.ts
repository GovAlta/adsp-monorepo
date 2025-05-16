import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { RootState } from '..';
import { select, call, put, takeEvery, all } from 'redux-saga/effects';
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
  UpdateSearchCalendarEventCriteriaAndFetchEventsAction,
  FetchEventsByCalendar,
  UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION,
  UpdateSearchCalendarEventCriteria,
  CalendarEventExportAction,
  EXPORT_EVENT_CALENDAR_ACTION,
  ExportCalendarEventsSuccess,
} from './actions';
import { UpdateElementIndicator } from '@store/session/actions';

import { ActionState } from '@store/session/models';
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
          update: { ...calendar },
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

type CriteriaParse = {
  startsAfter?: string;
  endsBefore?: string;
  recordId?: string;
};

export function* fetchEventsByCalendar(action: FetchEventsByCalendarAction): SagaIterator {
  const calendarBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.calendarServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const calendarName = action.payload;
  const criteria = yield select((state: RootState) => state?.calendarService?.eventSearchCriteria);
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
export function* exportEventsByCalendar(action: CalendarEventExportAction): SagaIterator {
  const calendarBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.calendarServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const calendarName = action.calendarName;

  const criteria = yield select((state: RootState) => state?.calendarService?.eventSearchCriteria);

  if (calendarBaseUrl && token) {
    const params = {};

    if (criteria) {
      params['criteria'] = JSON.stringify({
        startsAfter: criteria.startDate,
        endsBefore: criteria.endDate,
      });
    }
    if (action.top) {
      params['top'] = action.top;
    }
    try {
      yield put(UpdateElementIndicator({ show: true, id: EXPORT_EVENT_CALENDAR_ACTION }));
      const { data } = yield call(axios.get, `${calendarBaseUrl}/calendar/v1/calendars/${calendarName}/export`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      yield put(ExportCalendarEventsSuccess(data));
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

export function* watchCalendarSagas(): Generator {
  yield takeEvery(FETCH_CALENDARS_ACTION, fetchCalendars);
  yield takeEvery(UPDATE_CALENDAR_ACTION, updateCalendar);
  yield takeEvery(DELETE_CALENDAR_ACTION, deleteCalendar);
  yield takeEvery(FETCH_EVENTS_BY_CALENDAR_ACTION, fetchEventsByCalendar);
  yield takeEvery(CREATE_EVENT_CALENDAR_ACTION, CreateEventByCalendar);
  yield takeEvery(DELETE_CALENDAR_EVENT_ACTION, DeleteCalendarEvent);
  yield takeEvery(UPDATE_EVENT_CALENDAR_ACTION, UpdateEventByCalendar);
  yield takeEvery(UPDATE_EVENT_CALENDAR_AND_FETCH_ACTION, UpdateEventSearchCriteriaAndUpdateEvent);
  yield takeEvery(EXPORT_EVENT_CALENDAR_ACTION, exportEventsByCalendar);
}
