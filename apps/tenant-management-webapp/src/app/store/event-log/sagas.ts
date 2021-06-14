/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { ErrorNotification } from '@store/notifications/actions';
import axios from 'axios';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { RootState } from '..';
import { FetchEventLogEntriesAction, FETCH_EVENT_LOG_ENTRIES_ACTION, getEventLogEntriesSucceeded } from './actions';

export function* fetchEventLogEntries(action: FetchEventLogEntriesAction) {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const { data } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event?top=10&after=${action.after || ''}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(getEventLogEntriesSucceeded(data['event-service']['event'], data.page.after, data.page.next));
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* watchEventLogSagas() {
  yield takeEvery(FETCH_EVENT_LOG_ENTRIES_ACTION, fetchEventLogEntries);
}
