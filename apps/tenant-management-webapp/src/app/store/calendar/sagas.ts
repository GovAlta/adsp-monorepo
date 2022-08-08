import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/calendar/actions';
import { RootState } from '..';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';

import { getAccessToken } from '@store/tenant/sagas';
import {
  FetchCalendarsAction,
  CreateCalendarAction,
  fetchCalendarSuccess,
  CreateCalendarSuccess,
  FETCH_CALENDARS_ACTION,
  CREATE_CALENDAR_ACTION,
} from './actions';
import { CalendarItem } from './models';
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
      const calendars: CalendarItem[] = Object.values(data);
      yield put(fetchCalendarSuccess(calendars));

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

export function* createCalendar({ payload }: CreateCalendarAction): SagaIterator {
  const details = {};
  details[CREATE_CALENDAR_ACTION] = ActionState.inProcess;
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
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/calendar-service`,
        {
          operation: 'UPDATE',
          update: {
            [payload.id]: {
              id: payload.id,
              name: payload.name,
              displayName: payload.displayName,
              description: payload.description,
              readRoles: payload.readRoles,
              updateRoles: payload.updateRoles,
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(CreateCalendarSuccess(payload));
      details[CREATE_CALENDAR_ACTION] = ActionState.completed;
      yield put(
        UpdateIndicator({
          details,
        })
      );
    } catch (e) {
      details[CREATE_CALENDAR_ACTION] = ActionState.error;
      yield put(
        UpdateIndicator({
          details,
        })
      );
      yield put(ErrorNotification({ message: `${e.message} - createCalendar` }));
    }
  }
}

export function* watchCalendarSagas(): Generator {
  yield takeEvery(FETCH_CALENDARS_ACTION, fetchCalendars);
  yield takeEvery(CREATE_CALENDAR_ACTION, createCalendar);
}
