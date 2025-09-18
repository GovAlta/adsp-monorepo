import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import {
  getTaskQueuesSuccess,
  FETCH_TASK_QUEUES_ACTION,
  UPDATE_TASK_QUEUE_ACTION,
  DELETE_TASK_QUEUE_ACTION,
  DeleteTaskDefinitionAction,
  deleteTaskQueueSuccess,
  GET_TASKS_ACTION,
  CLEAR_Tasks_ACTION,
  GET_TASK_ACTION,
  GetsTasksAction,
  GetsTaskAction,
  getTasksSuccess,
  createTasksSuccess,
  getTaskSuccess,
  UpdateTaskQueueAction,
  UpdateTaskQueueSuccess,
  UpdateQueueTaskAction,
  updateQueueTaskSuccess,
  SetQueueTaskAction,
  SET_QUEUE_TASK_ACTION,
  UPDATE_QUEUE_TASK_ACTION,
} from './action';
import { getAccessToken } from '@store/tenant/sagas';
import { fetchTaskQueuesApi, deleteTaskQueuesApi, getTasksApi, postTasksApi, updateQueueTaskApi } from './api';
import { DeleteTaskConfig, TaskDefinition } from './model';
import axios from 'axios';

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

export function* updateTaskQueue({ payload }: UpdateTaskQueueAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Updating Queue...',
    })
  );
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  const namespace = payload.namespace;
  const name = payload.name;
  const queue = {
    queues: {
      [`${namespace}:${name}`]: {
        namespace,
        name,
        context: {},
        assignerRoles: payload.assignerRoles,
        workerRoles: payload.workerRoles,
      },
    },
  };

  if (configBaseUrl && token) {
    try {
      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/task-service`,
        {
          operation: 'UPDATE',
          update: { ...queue },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(
        UpdateTaskQueueSuccess({
          ...latest.configuration.queues,
        })
      );
      yield put(UpdateIndicator({ show: false }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(UpdateIndicator({ show: false }));
    }
  }
}

export function* deleteTaskDefinition({ queue }: DeleteTaskDefinitionAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Deleting Queue...',
    })
  );
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
      yield put(UpdateIndicator({ show: false }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(UpdateIndicator({ show: false }));
    }
  }
}

export function* getTasks(payload: GetsTasksAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Tasks...',
    })
  );
  const taskUrl: string = yield select((state: RootState) => state.config.serviceUrls?.taskServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const queue = payload.queue;
  const next = payload.next ? payload.next : '';

  if (taskUrl && token) {
    try {
      const url = `${taskUrl}/task/v1/queues/${queue.namespace}/${queue.name}/tasks?top=10&after=${next}`;
      const { results, page } = yield call(getTasksApi, token, url);

      yield put(getTasksSuccess(results, page.after, page.next));
      yield put(UpdateIndicator({ show: false }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(UpdateIndicator({ show: false }));
    }
  }
}
export function* getTask({ queue }: GetsTaskAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Tasks...',
    })
  );
  const taskUrl: string = yield select((state: RootState) => state.config.serviceUrls?.taskServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (taskUrl && token) {
    try {
      const url = `${taskUrl}/task/v1/queues/${queue.namespace}/${queue.name}/tasks?top=10`;
      const { results } = yield call(getTasksApi, token, url);

      yield put(getTaskSuccess(results));
      yield put(UpdateIndicator({ show: false }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(UpdateIndicator({ show: false }));
    }
  }
}
export function* updateQueueTask({ payload }: UpdateQueueTaskAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Updating Task...',
    })
  );
  const taskUrl: string = yield select((state: RootState) => state.config.serviceUrls?.taskServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (taskUrl && token) {
    try {
      const url = `${taskUrl}/task/v1/queues/${payload.queue.namespace}/${payload.queue.name}/tasks/${payload.id}`;
      const results = yield call(updateQueueTaskApi, token, url, payload);

      yield put(updateQueueTaskSuccess(results));
      yield put(UpdateIndicator({ show: false }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(UpdateIndicator({ show: false }));
    }
  }
}
export function* createTask({ payload }: SetQueueTaskAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Creating Task...',
    })
  );
  const taskUrl: string = yield select((state: RootState) => state.config.serviceUrls?.taskServiceApiUrl);
  const token: string = yield call(getAccessToken);
  if (taskUrl && token) {
    try {
      const url = `${taskUrl}/task/v1/queues/${payload.recordId.split(':')[0]}/${payload.recordId.split(':')[1]}/tasks`;
      const results = yield call(postTasksApi, token, url, payload);
      yield put(createTasksSuccess(results));
      yield put(UpdateIndicator({ show: false }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(UpdateIndicator({ show: false }));
    }
  }
}

function* clearTasksSaga(): SagaIterator {
  yield put(getTasksSuccess([], '', ''));
}

export function* watchTaskSagas(): Generator {
  yield takeEvery(FETCH_TASK_QUEUES_ACTION, fetchTaskQueues);
  yield takeEvery(UPDATE_TASK_QUEUE_ACTION, updateTaskQueue);
  yield takeEvery(DELETE_TASK_QUEUE_ACTION, deleteTaskDefinition);
  yield takeEvery(GET_TASKS_ACTION, getTasks);
  yield takeEvery(CLEAR_Tasks_ACTION, clearTasksSaga);
  yield takeEvery(GET_TASK_ACTION, getTask);
  yield takeEvery(SET_QUEUE_TASK_ACTION, createTask);
  yield takeEvery(UPDATE_QUEUE_TASK_ACTION, updateQueueTask);
}
