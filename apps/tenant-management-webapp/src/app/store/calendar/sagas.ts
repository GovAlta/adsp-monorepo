import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { DELETE_CALENDAR_ACTION, UpdateIndicator } from '@store/calendar/actions';
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
} from './actions';

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
      yield put(ErrorNotification({ message: err.message }));
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
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateCalendar` }));
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
      yield put(ErrorNotification({ message: `Calendar (delete calendar): ${err.message}` }));
    }
  }
}

export function* watchCalendarSagas(): Generator {
  yield takeEvery(FETCH_CALENDARS_ACTION, fetchCalendars);
  yield takeEvery(UPDATE_CALENDAR_ACTION, updateCalendar);
  yield takeEvery(DELETE_CALENDAR_ACTION, deleteCalendar);
}
