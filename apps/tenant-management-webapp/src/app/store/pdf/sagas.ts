import { SagaIterator } from '@redux-saga/core';
import { UpdateElementIndicator, UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery, take, apply, fork } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import { ErrorNotification } from '@store/notifications/actions';
import {
  fetchPdfMetricsSucceeded,
  FETCH_PDF_METRICS_ACTION,
  FETCH_PDF_TEMPLATES_ACTION,
  FETCH_CORE_PDF_TEMPLATES_ACTION,
  getPdfTemplatesSuccess,
  UpdatePdfTemplatesAction,
  updatePdfTemplateSuccess,
  updatePdfTemplateSuccessNoRefresh,
  UPDATE_PDF_TEMPLATE_ACTION,
  GeneratePdfAction,
  generatePdfSuccess,
  generatePdfSuccessProcessing,
  GENERATE_PDF_ACTION,
  addToStream,
  STREAM_PDF_SOCKET_ACTION,
  SOCKET_CHANNEL,
  StreamPdfSocketAction,
  DeletePdfTemplatesAction,
  deletePdfTemplateSuccess,
  DELETE_PDF_TEMPLATE_ACTION,
  SHOW_CURRENT_FILE_PDF,
  ShowCurrentFilePdfAction,
  showCurrentFilePdfSuccess,
  GENERATE_PDF_SUCCESS_PROCESSING_ACTION,
  GeneratePdfSuccessProcessingAction,
  getCorePdfTemplatesSuccess,
  DeletePdfFileServiceAction,
  DeletePdfFilesServiceAction,
  DELETE_PDF_FILE_SERVICE,
  DELETE_PDF_FILES_SERVICE,
  updateJobs,
} from './action';
import { readFileAsync } from './readFile';
import { io } from 'socket.io-client';
import { getAccessToken } from '@store/tenant/sagas';
import { PdfGenerationResponse, PdfTemplate, UpdatePdfConfig, DeletePdfConfig, CreatePdfConfig } from './model';
import {
  fetchPdfTemplatesApi,
  updatePDFTemplateApi,
  fetchPdfFileApi,
  deletePdfFileApi,
  generatePdfApi,
  createPdfJobApi,
} from './api';
import { fetchServiceMetrics } from '@store/common';

export function* fetchPdfTemplates(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading template...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/platform/pdf-service/latest`;
      const templates = yield call(fetchPdfTemplatesApi, token, url);
      yield put(getPdfTemplatesSuccess(templates));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
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
export function* fetchCorePdfTemplates(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading template...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/platform/pdf-service?core`;
      const { latest } = yield call(fetchPdfTemplatesApi, token, url);

      yield put(getCorePdfTemplatesSuccess(latest?.configuration));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
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

export function* generatePdfSuccessProcessingSaga(action: GeneratePdfSuccessProcessingAction): SagaIterator {
  let jobs = yield select((state: RootState) => state.pdf?.jobs);

  const newJobs = JSON.parse(JSON.stringify(jobs));
  const index = jobs.findIndex((job) => job.id === action.payload.context?.jobId);
  if (index > -1) {
    if (!jobs[index].stream) {
      jobs[index].stream = [];
    }
    jobs[index].stream.push(action.payload);
    jobs[index].status = action.payload.name;
  } else {
    if (action.payload?.filename) {
      jobs = [action.payload].concat(jobs);
    }
  }

  if (JSON.stringify(jobs) !== JSON.stringify(newJobs)) {
    yield put(generatePdfSuccess(action.payload));
  }
}
export function* deletePdfFileService(action: DeletePdfFileServiceAction): SagaIterator {
  const jobs: PdfGenerationResponse[] = yield select((state: RootState) => state.pdf?.jobs);

  const currentTemplateId = jobs.find((job) => job.id === action.payload.data.recordId).templateId;

  const remainingJobs = jobs.filter((job) => job.id !== action.payload.data.recordId);

  yield put(updateJobs(remainingJobs, currentTemplateId));
}

export function* deletePdfFilesService(action: DeletePdfFilesServiceAction): SagaIterator {
  const jobs: PdfGenerationResponse[] = yield select((state: RootState) => state.pdf?.jobs);

  const remainingJobs = jobs.filter((job) => job.templateId !== action.payload.templateId);

  yield put(updateJobs(remainingJobs, null));
}

// wrapping function for socket.on
let socket;

const connect = (pushServiceUrl, token, stream) => {
  return new Promise((resolve) => {
    socket = io(`${pushServiceUrl}`, {
      query: {
        stream: stream,
      },
      path: '/socket.io',
      secure: true,
      withCredentials: true,
      extraHeaders: { Authorization: `Bearer ${token}` },
    });

    socket.on('connect', () => {
      resolve(socket);
    });

    socket.on('disconnect', () => {
      resolve(socket);
    });

    return socket;
  });
};

export function* updatePdfTemplate({ template, options }: UpdatePdfTemplatesAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);

  yield put(UpdateElementIndicator({ show: true }));

  const token: string = yield call(getAccessToken);
  if (baseUrl && token) {
    try {
      const pdfTemplate = {
        [template.id]: {
          ...template,
        },
      };

      const body: UpdatePdfConfig = { operation: 'UPDATE', update: { ...pdfTemplate } };
      const url = `${baseUrl}/configuration/v2/configuration/platform/pdf-service`;
      const { latest } = yield call(updatePDFTemplateApi, token, url, body);

      if (options === 'no-refresh') {
        yield put(
          updatePdfTemplateSuccessNoRefresh({
            ...latest.configuration,
          })
        );
      } else {
        yield put(
          updatePdfTemplateSuccess(
            {
              ...latest.configuration,
            },
            { templateId: template.id }
          )
        );
      }
      yield put(UpdateElementIndicator({ show: false }));
    } catch (err) {
      yield put(UpdateElementIndicator({ show: false }));
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* showCurrentFilePdf(action: ShowCurrentFilePdfAction): SagaIterator {
  const fileUrl = yield select((state: RootState) => state.config.serviceUrls?.fileApi);

  const token: string = yield call(getAccessToken);

  if (fileUrl && token) {
    try {
      const url = `${fileUrl}/file/v1/files/${action.fileId}/download?unsafe=true`;
      const data = yield call(fetchPdfFileApi, token, url);
      const responseFile = yield call(readFileAsync, data);

      yield put(showCurrentFilePdfSuccess(responseFile, action.fileId));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deletePdfTemplate({ template }: DeletePdfTemplatesAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const payload: DeletePdfConfig = { operation: 'DELETE', property: template.id };
      const url = `${baseUrl}/configuration/v2/configuration/platform/pdf-service`;
      const { latest } = yield call(deletePdfFileApi, token, url, payload);

      yield put(
        deletePdfTemplateSuccess({
          ...latest.configuration,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* streamPdfSocket({ disconnect }: StreamPdfSocketAction): SagaIterator {
  const pushServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pushServiceApiUrl);
  const token: string = yield call(getAccessToken);

  // This is how a channel is created
  const createSocketChannel = (socket) =>
    eventChannel((emit) => {
      const currentEvents = [];

      const handler = (data) => {
        currentEvents.push(data);
        emit(data);
      };

      const doneHandler = (data) => {
        currentEvents.push(data);
        emit(data);
      };

      socket.on('pdf-service:pdf-generated', doneHandler);
      socket.on('pdf-service:pdf-generation-queued', handler);
      socket.on('pdf-service:pdf-generation-failed', doneHandler);
      socket.on('error', handler);

      const unsubscribe = () => {
        socket.off('ping', handler);
      };

      return unsubscribe;
    });
  if (disconnect === true) {
    socket.disconnect();
  } else {
    const sk = yield call(connect, pushServiceUrl, token, 'pdf-generation-updates');
    const socketChannel = yield call(createSocketChannel, sk);
    yield put({ socketChannel: true, type: SOCKET_CHANNEL });

    try {
      const currentEvents = [];
      while (true) {
        const payload = yield take(socketChannel);
        currentEvents.push(payload);
        yield put(addToStream(payload));
        yield put(generatePdfSuccessProcessing(payload));
        yield fork(emitResponse, socket);
      }
    } catch (err) {
      console.error('socket error: ', err);
    }
  }
}

function* emitResponse(socket) {
  yield apply(socket, socket.emit, ['message received']);
}

export function* generatePdf({ payload }: GeneratePdfAction): SagaIterator {
  const pdfServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pdfServiceApiUrl);
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const tempTemplate: PdfTemplate = yield select((state: RootState) => state.pdf.tempTemplate);

  const token: string = yield call(getAccessToken);

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Generating PDF...',
    })
  );

  if (pdfServiceUrl && token && baseUrl) {
    try {
      // save first
      const pdfTemplate = {
        [tempTemplate.id]: {
          ...tempTemplate,
        },
      };
      const saveBody: UpdatePdfConfig = { operation: 'UPDATE', update: { ...pdfTemplate } };
      const url = `${baseUrl}/configuration/v2/configuration/platform/pdf-service`;
      yield call(generatePdfApi, token, url, saveBody);

      const combinedData = payload.data;
      if (payload.inputData) {
        combinedData.content = { data: payload.inputData };
      }

      // generate after
      const pdfData = {
        templateId: payload.templateId,
        data: combinedData,
        filename: payload.fileName,
      };

      const createJobUrl = `${pdfServiceUrl}/pdf/v1/jobs`;
      const body: CreatePdfConfig = { operation: 'generate', ...pdfData };
      const data = yield call(createPdfJobApi, token, createJobUrl, body);
      const pdfResponse = { ...body, ...data };
      yield put(generatePdfSuccess(pdfResponse, saveBody.update));
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

export function* fetchPdfMetrics(): SagaIterator {
  yield* fetchServiceMetrics('pdf-service', function* (metrics) {
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
  });
}

export function* watchPdfSagas(): Generator {
  yield takeEvery(FETCH_PDF_TEMPLATES_ACTION, fetchPdfTemplates);
  yield takeEvery(FETCH_CORE_PDF_TEMPLATES_ACTION, fetchCorePdfTemplates);
  yield takeEvery(UPDATE_PDF_TEMPLATE_ACTION, updatePdfTemplate);
  yield takeEvery(FETCH_PDF_METRICS_ACTION, fetchPdfMetrics);
  yield takeEvery(GENERATE_PDF_ACTION, generatePdf);
  yield takeEvery(STREAM_PDF_SOCKET_ACTION, streamPdfSocket);
  yield takeEvery(DELETE_PDF_TEMPLATE_ACTION, deletePdfTemplate);
  yield takeEvery(DELETE_PDF_FILE_SERVICE, deletePdfFileService);
  yield takeEvery(DELETE_PDF_FILES_SERVICE, deletePdfFilesService);
  yield takeEvery(SHOW_CURRENT_FILE_PDF, showCurrentFilePdf);
  yield takeEvery(GENERATE_PDF_SUCCESS_PROCESSING_ACTION, generatePdfSuccessProcessingSaga);
}
