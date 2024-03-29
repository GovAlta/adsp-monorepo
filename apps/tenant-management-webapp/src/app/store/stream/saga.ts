import { put, select, call, takeEvery, all } from 'redux-saga/effects';
import { RootState } from '@store/index';
import { ErrorNotification } from '@store/notifications/actions';
import {
  DeleteEventStreamAction,
  deleteEventStreamSuccess,
  DELETE_EVENT_STREAM_ACTION,
  fetchEventStreamsSuccess,
  FETCH_EVENT_STREAMS,
  startSocketSuccess,
  StartStreamAction,
  START_SOCKET_STREAM_ACTION,
  UpdateEventStreamAction,
  updateEventStreamSuccess,
  UPDATE_EVENT_STREAM_ACTION,
} from './actions';
import { SagaIterator } from '@redux-saga/core';
import axios from 'axios';
import { UpdateIndicator } from '@store/session/actions';
import { io, Socket } from 'socket.io-client';
import { getAccessToken } from '@store/tenant/sagas';

function selectConfigBaseUrl(state: RootState): string {
  return state.config.serviceUrls.configurationServiceApiUrl;
}

const SERVICE_NAME = 'push-service';
const API_VERSION = 'v2';

export function* fetchEventStreams(): SagaIterator {
  try {
    yield put(
      UpdateIndicator({
        show: true,
        message: 'Loading...',
      })
    );
    const state: RootState = yield select();
    const baseUrl = selectConfigBaseUrl(state);
    const token = yield call(getAccessToken);

    const { tenantStreams, coreStreams } = yield all({
      tenantStreams: call(
        axios.get,
        `${baseUrl}/configuration/${API_VERSION}/configuration/platform/${SERVICE_NAME}/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
      coreStreams: call(
        axios.get,
        `${baseUrl}/configuration/${API_VERSION}/configuration/platform/${SERVICE_NAME}/latest?core`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      ),
    });
    yield put(
      fetchEventStreamsSuccess({
        tenantStreams: tenantStreams.data,
        coreStreams: coreStreams.data,
      })
    );
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
  } catch (err) {
    yield put(
      UpdateIndicator({
        show: false,
      })
    );
    yield put(ErrorNotification({ error: err }));
  }
}

export function* updateEventStream({ stream }: UpdateEventStreamAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const eventStream = {
        [stream.id]: {
          ...stream,
        },
      };
      const body = { operation: 'UPDATE', update: { ...eventStream } };
      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${baseUrl}/configuration/${API_VERSION}/configuration/platform/${SERVICE_NAME}`,
        body,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(
        updateEventStreamSuccess({
          ...latest.configuration,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}
export function* deleteEventStream({ eventStreamId }: DeleteEventStreamAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${baseUrl}/configuration/${API_VERSION}/configuration/platform/${SERVICE_NAME}`,
        { operation: 'DELETE', property: eventStreamId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(deleteEventStreamSuccess({ ...latest.configuration }));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* startSocket({ url, stream }: StartStreamAction): SagaIterator {
  const token: string = yield call(getAccessToken);
  const socket: Socket = io(url, {
    query: {
      stream: stream,
    },
    withCredentials: true,
    extraHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
  yield put(startSocketSuccess(socket));
}

export function* watchStreamSagas(): Generator {
  yield takeEvery(FETCH_EVENT_STREAMS, fetchEventStreams);
  yield takeEvery(UPDATE_EVENT_STREAM_ACTION, updateEventStream);
  yield takeEvery(START_SOCKET_STREAM_ACTION, startSocket);
  yield takeEvery(DELETE_EVENT_STREAM_ACTION, deleteEventStream);
}
