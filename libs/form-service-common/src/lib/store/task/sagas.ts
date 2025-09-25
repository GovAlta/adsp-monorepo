import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '../session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '../notifications/actions';
import { FETCH_TASK_QUEUES_ACTION, getTaskQueuesSuccess } from './action';
import { getAccessToken } from '../tenant/sagas';
import { fetchTaskQueuesApi } from './api';

export function* fetchTaskQueues(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Queues...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/platform/task-service`;
      const Payload = yield call(fetchTaskQueuesApi, token, url);

      yield put(getTaskQueuesSuccess(Payload?.latest?.configuration.queues || {}));
      yield put(UpdateIndicator({ show: false }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* watchTaskSagas(): Generator {
  yield takeEvery(FETCH_TASK_QUEUES_ACTION, fetchTaskQueues);
}
