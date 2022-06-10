import axios from 'axios';
import moment from 'moment';
import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery, take, apply, fork } from 'redux-saga/effects';
import { eventChannel, END } from 'redux-saga';
import { ErrorNotification } from '@store/notifications/actions';
import {
  fetchPdfMetricsSucceeded,
  FETCH_PDF_METRICS_ACTION,
  FETCH_PDF_TEMPLATES_ACTION,
  getPdfTemplatesSuccess,
  UpdatePdfTemplatesAction,
  updatePdfTemplateSuccess,
  UPDATE_PDF_TEMPLATE_ACTION,
  GeneratePdfAction,
  generatePdfSuccess,
  GENERATE_PDF_ACTION,
  addToStream,
  STREAM_PDF_SOCKET_ACTION,
  StreamPdfSocketAction,
} from './action';
import { io } from 'socket.io-client';
import { FETCH_FILE_LIST } from '@store/file/actions';

export function* fetchPdfTemplates(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  if (configBaseUrl && token) {
    try {
      const { data } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/pdf-service/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(getPdfTemplatesSuccess(data));
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

// wrapping function for socket.on
let socket;

const connect = (pushServiceUrl, token, stream, tenantName) => {
  return new Promise((resolve) => {
    socket = io(`${pushServiceUrl}/${tenantName}`, {
      query: {
        stream: stream,
      },
      path: '/socket.io',
      secure: true,
      withCredentials: true,
      extraHeaders: { Authorization: `Bearer ${token}` },
    });

    socket.on('connect', () => {
      console.log('socket connected');
      resolve(socket);
    });

    socket.on('disconnect', () => {
      console.log('socket disconnected');
      resolve(socket);
    });

    return socket;
  });
};

export function* updatePdfTemplate({ template }: UpdatePdfTemplatesAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const pdfTemplate = {
        [template.id]: {
          ...template,
        },
      };
      const body = { operation: 'UPDATE', update: { ...pdfTemplate } };
      const {
        data: { latest },
      } = yield call(axios.patch, `${baseUrl}/configuration/v2/configuration/platform/pdf-service`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      yield put(
        updatePdfTemplateSuccess({
          ...latest.configuration,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* streamPdfSocket({ disconnect }: StreamPdfSocketAction): SagaIterator {
  const pushServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pushServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);
  const tenant = yield select((state: RootState) => state?.tenant);

  // This is how a channel is created
  const createSocketChannel = (socket) =>
    eventChannel((emit) => {
      const handler = (data) => {
        console.log('Handler: ' + JSON.stringify(data));
        emit(data);
      };
      socket.on('connect', () => {
        console.log('socket connected');
      });

      const doneHandler = (data) => {
        emit(data);
        socket.disconnect();
      };

      socket.on('pdf-service:pdf-generated', doneHandler);
      socket.on('pdf-service:pdf-generation-queued', handler);
      socket.on('pdf-service:pdf-generation-failed', handler);
      socket.on('error', handler);

      const unsubscribe = () => {
        socket.off('ping', handler);
      };

      return unsubscribe;
    });
  if (disconnect === true) {
    socket.disconnect();
  } else {
    const sk = yield call(connect, pushServiceUrl, token, 'pdf-generation-updates', tenant?.name);

    const socketChannel = yield call(createSocketChannel, sk);

    try {
      while (true) {
        const payload = yield take(socketChannel);
        yield put(addToStream(payload));
        if (payload?.name === 'pdf-generated' || payload?.name === 'pdf-generation-failed') {
          yield put({ type: FETCH_FILE_LIST });
        }

        yield fork(emitResponse, socket);
      }
    } catch (err) {
      console.log('socket error: ', err);
    }
  }
}

function* emitResponse(socket) {
  yield apply(socket, socket.emit, ['message received']);
}

export function* generatePdf({ payload }: GeneratePdfAction): SagaIterator {
  const pdfServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pdfServiceApiUrl);

  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading...',
    })
  );

  if (pdfServiceUrl && token) {
    try {
      const pdfData = {
        templateId: payload.templateId,
        recordId: payload.templateId + '_' + Date.now(),
        data: payload.data,
        filename: payload.fileName,
      };
      const body = { operation: 'generate', ...pdfData };
      const response = yield call(axios.post, `${pdfServiceUrl}/pdf/v1/jobs`, body, {
        headers: { Authorization: `Bearer ${token}` },
      });
      yield put(generatePdfSuccess(response));
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

interface MetricResponse {
  values: { sum: string; avg: string }[];
}

export function* fetchPdfMetrics(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().subtract(7, 'day').toISOString(),
        metricLike: 'pdf-service',
      });

      const { data: metrics }: { data: Record<string, MetricResponse> } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}`, 'Access-Control-Allow-Origin': '' } }
      );

      const generatedMetric = 'pdf-service:pdf-generated:count';
      const failedMetric = 'pdf-service:pdf-generation-failed:count';
      const durationMetric = 'pdf-service:pdf-generation:duration';
      yield put(
        fetchPdfMetricsSucceeded({
          pdfGenerated: parseInt(metrics[generatedMetric]?.values[0]?.sum || '0'),
          pdfFailed: parseInt(metrics[failedMetric]?.values[0]?.sum || '0'),
          generationDuration: metrics[durationMetric]?.values[0]
            ? parseInt(metrics[durationMetric]?.values[0].avg)
            : null,
        })
      );
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - fetchNotificationMetrics` }));
    }
  }
}

export function* watchPdfSagas(): Generator {
  yield takeEvery(FETCH_PDF_TEMPLATES_ACTION, fetchPdfTemplates);
  yield takeEvery(UPDATE_PDF_TEMPLATE_ACTION, updatePdfTemplate);
  yield takeEvery(FETCH_PDF_METRICS_ACTION, fetchPdfMetrics);
  yield takeEvery(GENERATE_PDF_ACTION, generatePdf);
  yield takeEvery(STREAM_PDF_SOCKET_ACTION, streamPdfSocket);
}
