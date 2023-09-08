import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import {
  getTaskQueuesSuccess,
  FETCH_TASK_QUEUES_ACTION,
  DELETE_TASK_QUEUE_ACTION,
  DeleteTaskDefinitionAction,
  deleteTaskQueueSuccess,
  GET_TASKS_ACTION,
  GetsTasksAction,
  getTasksSuccess,
} from './action';
import { getAccessToken } from '@store/tenant/sagas';
import { fetchTaskQueuesApi, deleteTaskQueuesApi, getTasksApi } from './api';
import { DeleteTaskConfig, TaskDefinition } from './model';

export function* fetchTaskQueues(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Definition...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/platform/task-service/latest`;
      const Payload = yield call(fetchTaskQueuesApi, token, url);

      yield put(getTaskQueuesSuccess(Payload?.queues || {}));
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

export function* deleteTaskDefinition({ queue }: DeleteTaskDefinitionAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const existingQueues: Record<string, TaskDefinition> = yield select((state: RootState) => state.task.queues);
  const token: string = yield call(getAccessToken);

  delete existingQueues[`${queue.namespace}:${queue.name}`];

  if (baseUrl && token) {
    try {
      const payload: DeleteTaskConfig = { operation: 'REPLACE', configuration: { queues: existingQueues } };
      const url = `${baseUrl}/configuration/v2/configuration/platform/task-service`;
      const { latest } = yield call(deleteTaskQueuesApi, token, url, payload);

      yield put(
        deleteTaskQueueSuccess({
          ...latest.configuration?.queues,
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.response.data} - deleteTaskDefinition` }));
    }
  }
}

export function* getTasks({ queue }: GetsTasksAction): SagaIterator {
  const taskUrl: string = yield select((state: RootState) => state.config.serviceUrls?.taskServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (taskUrl && token) {
    try {
      const url = `${taskUrl}/task/v1/queues/${queue.namespace}/${queue.name}/tasks`;
      const { results } = yield call(getTasksApi, token, url);

      yield put(getTasksSuccess(results));
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.response} - getTasks` }));
    }
  }
}

export function* watchTaskSagas(): Generator {
  yield takeEvery(FETCH_TASK_QUEUES_ACTION, fetchTaskQueues);
  yield takeEvery(DELETE_TASK_QUEUE_ACTION, deleteTaskDefinition);
  yield takeEvery(GET_TASKS_ACTION, getTasks);
}
