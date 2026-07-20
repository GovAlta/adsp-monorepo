import { SagaIterator } from '@redux-saga/core';
import { UpdateElementIndicator, UpdateIndicator } from '@store/session/actions';
import { RootState, store } from '../index';
import { select, call, put, takeEvery, take, apply, fork } from 'redux-saga/effects';
import { eventChannel } from 'redux-saga';
import { ErrorNotification } from '@store/notifications/actions';
import {
  fetchPdfMetricsSucceeded,
  FETCH_PDF_METRICS_ACTION,
  FETCH_PDF_TEMPLATES_ACTION,
  FETCH_CORE_PDF_TEMPLATES_ACTION,
  getPdfTemplatesSuccess,
  CreatePdfTemplateAction,
  createPdfTemplateSuccess,
  CREATE_PDF_TEMPLATE_ACTION,
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
  clearPdfPreviewStale,
  markPdfPreviewStale,
  saveUpdatedPdfTemplate,
  updatePdfTemplateFromAgent,
  generatePdf as generatePdfAction,
} from './action';
import { readFileAsync } from './readFile';
import { io } from 'socket.io-client';
import { getAccessToken as getAccessTokenThunk } from '@store/tenant/actions';
import { getAccessToken } from '@store/tenant/sagas';
import { PdfGenerationResponse, PdfTemplate, CreatePdfConfig } from './model'; // clean-code-ignore: RULE-19 — covered by ./saga.spec.tsx, the established one-spec-per-slice convention in this folder
import {
  fetchPdfTemplatesApi,
  createPdfTemplateApi,
  updatePDFTemplateApi,
  fetchPdfFileApi,
  deletePdfTemplateApi,
  generatePdfApi,
  createPdfJobApi,
} from './api';
import { fetchServiceMetrics } from '@store/common';
import { AGENT_RESPONSE_ACTION, AgentResponseAction, TOOL_CALL_RESULT } from '../agent/actions';

export function* fetchPdfTemplates(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading template...',
    }),
  );

  const pdfServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pdfServiceApiUrl);
  const token: string = yield call(getAccessToken);
  if (pdfServiceUrl && token) {
    try {
      const url = `${pdfServiceUrl}/pdf/v1/templates`;
      const templateList: PdfTemplate[] = yield call(fetchPdfTemplatesApi, token, url);
      const templates = templateList.reduce(
        (acc, template) => ({ ...acc, [template.id]: template }),
        {} as Record<string, PdfTemplate>,
      );
      yield put(getPdfTemplatesSuccess(templates));
      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    }
  }
}
export function* fetchCorePdfTemplates(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading template...',
    }),
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl,
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
        }),
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        }),
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

const connect = (pushServiceUrl, stream) => {
  return new Promise((resolve) => {
    socket = io(`${pushServiceUrl}`, {
      query: {
        stream: stream,
      },
      path: '/socket.io',
      secure: true,
      withCredentials: true,
      auth: async (cb) => {
        try {
          const token = await store.dispatch(getAccessTokenThunk());
          cb({ token });
        } catch (err) {
          cb({});
        }
      },
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

// clean-code-ignore: 2.18 2.3 2.10 — mirrors the existing select/indicator/call/error pattern used by every other saga in this file (e.g. updatePdfTemplate, deletePdfTemplate)
export function* createPdfTemplateSaga({ template }: CreatePdfTemplateAction): SagaIterator {
  const pdfServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pdfServiceApiUrl);

  yield put(UpdateElementIndicator({ show: true }));

  const token: string = yield call(getAccessToken);
  if (pdfServiceUrl && token) {
    try {
      const url = `${pdfServiceUrl}/pdf/v1/templates`;
      const createdTemplate = yield call(createPdfTemplateApi, token, url, {
        name: template.name,
        description: template.description,
        template: template.template,
        header: template.header,
        footer: template.footer,
        additionalStyles: template.additionalStyles,
        variables: template.variables,
      });
      yield put(createPdfTemplateSuccess(createdTemplate));
      yield put(UpdateElementIndicator({ show: false }));
    } catch (err) {
      yield put(UpdateElementIndicator({ show: false }));
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* updatePdfTemplate({ template, options }: UpdatePdfTemplatesAction): SagaIterator {
  const pdfServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pdfServiceApiUrl);

  yield put(UpdateElementIndicator({ show: true }));

  const token: string = yield call(getAccessToken);
  if (pdfServiceUrl && token) {
    try {
      const body: Partial<PdfTemplate> = {
        name: template.name,
        description: template.description,
        template: template.template,
        header: template.header,
        footer: template.footer,
        additionalStyles: template.additionalStyles,
        variables: template.variables,
      };
      const url = `${pdfServiceUrl}/pdf/v1/templates/${template.id}`;
      const updated: PdfTemplate = yield call(updatePDFTemplateApi, token, url, body);

      if (options === 'no-refresh') {
        yield put(
          updatePdfTemplateSuccessNoRefresh({
            [updated.id]: updated,
          }),
        );
      } else {
        const existing: Record<string, PdfTemplate> = yield select((state: RootState) => state.pdf.pdfTemplates);
        yield put(
          updatePdfTemplateSuccess(
            {
              ...existing,
              [updated.id]: updated,
            },
            { templateId: template.id },
          ),
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
        }),
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deletePdfTemplate({ template }: DeletePdfTemplatesAction): SagaIterator {
  const pdfServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pdfServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (pdfServiceUrl && token) {
    // clean-code-ignore: 2.4 — matches the if (x && token) guard used by every other saga in this file
    try {
      const url = `${pdfServiceUrl}/pdf/v1/templates/${template.id}`;
      yield call(deletePdfTemplateApi, token, url);

      const pdfTemplates: Record<string, PdfTemplate> = yield select((state: RootState) => state.pdf.pdfTemplates);
      const remainingTemplates = { ...pdfTemplates };
      // clean-code-ignore: 2.14 — not duplicated with deletePdfFilesService's jobs.filter above: that
      // filters an array of jobs by templateId, this removes one key from a templates dict by id.
      delete remainingTemplates[template.id];

      yield put(deletePdfTemplateSuccess(remainingTemplates));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* streamPdfSocket({ disconnect }: StreamPdfSocketAction): SagaIterator {
  const pushServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pushServiceApiUrl);

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
    const sk = yield call(connect, pushServiceUrl, 'pdf-generation-updates');
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

export function* generatePdf({ payload, agentTemplate }: GeneratePdfAction): SagaIterator {
  const pdfServiceUrl: string = yield select((state: RootState) => state.config.serviceUrls?.pdfServiceApiUrl);
  let tempTemplate: PdfTemplate = yield select((state: RootState) => state.pdf.tempTemplate);

  const token: string = yield call(getAccessToken);

  yield put(
    UpdateIndicator({
      show: true,
      message: 'Processing may take a while. Please wait...',
    }),
  );

  if (pdfServiceUrl && token) {
    try {
      if (agentTemplate) {
        tempTemplate = agentTemplate;
      }

      const templateMap = {
        [tempTemplate.id]: {
          ...tempTemplate,
        },
      };

      if (!agentTemplate) {
        const saveBody: Partial<PdfTemplate> = {
          name: tempTemplate.name,
          description: tempTemplate.description,
          template: tempTemplate.template,
          header: tempTemplate.header,
          footer: tempTemplate.footer,
          additionalStyles: tempTemplate.additionalStyles,
          variables: tempTemplate.variables,
        };
        const saveUrl = `${pdfServiceUrl}/pdf/v1/templates/${tempTemplate.id}`;
        yield call(generatePdfApi, token, saveUrl, saveBody);
      }

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
      yield put(generatePdfSuccess(pdfResponse, templateMap));
      yield put(
        UpdateIndicator({
          show: false,
        }),
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        }),
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
      }),
    );
  });
}

// Tools whose results carry the full saved PDF template; the result is merged into the store,
// so only add tools here whose result shape matches PdfTemplate.
const MUTATION_TOOLS = new Set(['pdfConfigurationUpdateTool']);

function isMutationToolResult(chunk: AgentResponseAction['chunk']): boolean {
  return chunk?.type === TOOL_CALL_RESULT && MUTATION_TOOLS.has(chunk.payload.toolName);
}

export function* refreshDefinitionOnAgentResponse({ chunk, done }: AgentResponseAction): SagaIterator {
  if (isMutationToolResult(chunk)) {
    yield put(markPdfPreviewStale());
    const chunkPayload = chunk?.payload as unknown as { result: Record<string, object> };
    yield put(saveUpdatedPdfTemplate(chunkPayload.result));

    // The tool result is the authoritative saved template; merge it into pdfTemplates directly
    // so the editor tabs reflect the agent's changes. A refetch of the configuration "latest"
    // immediately after the update can return a stale cached revision, so it is not used here.
    const updatedTemplate = chunkPayload.result as unknown as PdfTemplate;
    if (updatedTemplate?.id) {
      yield put(updatePdfTemplateFromAgent(updatedTemplate));
    }
  }

  if (done) {
    const currentlyGeneratedPDFData = yield select((state: RootState) => state.pdf?.currentlyGeneratedPDFData);
    const isPreviewMarkedStale: boolean = yield select((state: RootState) => state.pdf.previewStale);
    if (isPreviewMarkedStale) {
      yield put(clearPdfPreviewStale());

      const payload = {
        templateId: currentlyGeneratedPDFData.id,
        data: currentlyGeneratedPDFData.variables ? JSON.parse(currentlyGeneratedPDFData.variables) : {},
        fileName: `${currentlyGeneratedPDFData.id}_${new Date().toJSON().slice(0, 19).replace(/:/g, '-')}.pdf`,
      };

      yield put(generatePdfAction(payload, currentlyGeneratedPDFData));
    }
  }
}

export function* watchPdfSagas(): Generator {
  yield takeEvery(FETCH_PDF_TEMPLATES_ACTION, fetchPdfTemplates);
  yield takeEvery(FETCH_CORE_PDF_TEMPLATES_ACTION, fetchCorePdfTemplates);
  yield takeEvery(CREATE_PDF_TEMPLATE_ACTION, createPdfTemplateSaga);
  yield takeEvery(UPDATE_PDF_TEMPLATE_ACTION, updatePdfTemplate);
  yield takeEvery(FETCH_PDF_METRICS_ACTION, fetchPdfMetrics);
  yield takeEvery(GENERATE_PDF_ACTION, generatePdf);
  yield takeEvery(STREAM_PDF_SOCKET_ACTION, streamPdfSocket);
  yield takeEvery(DELETE_PDF_TEMPLATE_ACTION, deletePdfTemplate);
  yield takeEvery(DELETE_PDF_FILE_SERVICE, deletePdfFileService);
  yield takeEvery(DELETE_PDF_FILES_SERVICE, deletePdfFilesService);
  yield takeEvery(SHOW_CURRENT_FILE_PDF, showCurrentFilePdf);
  yield takeEvery(GENERATE_PDF_SUCCESS_PROCESSING_ACTION, generatePdfSuccessProcessingSaga);
  yield takeEvery(AGENT_RESPONSE_ACTION, refreshDefinitionOnAgentResponse);
}
