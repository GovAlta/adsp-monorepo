import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '..';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';

import { getAccessToken } from '@store/tenant/sagas';
import {
  FetchCalendarsAction,
  UpdateCalendarAction,
  CreateCalendarAction,
  fetchCalendarSuccess,
  UpdateCalendarSuccess,
  FETCH_CALENDARS_ACTION,
  CREATE_CALENDAR_ACTION,
} from './actions';
import { CalendarItem } from './models';

export function* fetchCalendars(action: FetchCalendarsAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.calendarServiceApiUrl);
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const { data } = yield call(axios.get, `${configBaseUrl}/calendar/v1/calendars`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const calendars: CalendarItem[] = data;
      console.log('payload', data);
      yield put(fetchCalendarSuccess(calendars));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* updateCalendar({ payload }: UpdateCalendarAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const body = {
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
      };
      const {
        data: { latest },
      } = yield call(axios.patch, `${baseUrl}/configuration/v2/configuration/platform/calendar-service`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      yield put(
        UpdateCalendarSuccess({
          ...latest,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}
export function* createCalendar({ payload }: CreateCalendarAction): SagaIterator {
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
      // yield put(FetchFileTypeService());
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - createFileType` }));
    }
  }
}

export function* watchCalendarSagas(): Generator {
  yield takeEvery(FETCH_CALENDARS_ACTION, fetchCalendars);
  yield takeEvery(CREATE_CALENDAR_ACTION, createCalendar);
}
