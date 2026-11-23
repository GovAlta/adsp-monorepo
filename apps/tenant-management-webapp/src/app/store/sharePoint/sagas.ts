import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';
import { call, put, select, takeEvery } from 'redux-saga/effects';
import { RootState } from '..';
import { UpdateIndicator } from '@store/session/actions';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';
import {
  DELETE_SHAREPOINT_CONNECTION_ACTION,
  DELETE_SHAREPOINT_DESTINATION_ACTION,
  DeleteSharepointConnectionAction,
  DeleteSharepointDestinationAction,
  FETCH_SHAREPOINT_CONFIGURATION_ACTION,
  FETCH_SHAREPOINT_CREDENTIAL_STATUS_ACTION,
  FETCH_SHAREPOINT_FORMS_ACTION,
  fetchSharepointConfigurationSuccess,
  FetchSharepointCredentialStatusAction,
  fetchSharepointCredentialStatusSuccess,
  fetchSharepointFormsSuccess,
  SET_UP_SHAREPOINT_DESTINATION_ACTION,
  SetUpSharepointDestinationAction,
  setUpSharepointDestinationSuccess,
  SharepointConfiguration,
  SharepointConnection,
  SharepointDestination,
  SharepointFormChoice,
  SharepointSetupSummary,
  SharepointVerifyReport,
  TEST_SHAREPOINT_DESTINATION_ACTION,
  TestSharepointDestinationAction,
  testSharepointDestinationSuccess,
  UPDATE_SHAREPOINT_CONNECTION_ACTION,
  UPDATE_SHAREPOINT_DESTINATION_ACTION,
  updateSharepointConfigurationSuccess,
  UpdateSharepointConnectionAction,
  UpdateSharepointDestinationAction,
  VERIFY_SHAREPOINT_DESTINATION_ACTION,
  verifySharepointDestination,
  VerifySharepointDestinationAction,
  verifySharepointDestinationSuccess,
} from './actions';

const CONFIGURATION_PATH = 'configuration/v2/configuration/platform/sharepoint-service';

const selectConfigurationUrl = (state: RootState) =>
  `${state.config.serviceUrls?.configurationServiceApiUrl}/${CONFIGURATION_PATH}`;
const selectSharepointApiUrl = (path: string) => (state: RootState) =>
  `${state.config.serviceUrls?.sharepointServiceApiUrl}/sharepoint/v1${path}`;
const credentialPath = (connectionId: string) => `/connections/${encodeURIComponent(connectionId)}/credentials`;

export const toSharepointConfiguration = (raw?: Partial<SharepointConfiguration>): SharepointConfiguration => ({
  connections: raw?.connections || {},
  destinations: raw?.destinations || {},
});

const without = <T>(items: Record<string, T>, id: string): Record<string, T> =>
  Object.fromEntries(Object.entries(items).filter(([key]) => key !== id));

export function* patchSharepointConfiguration(
  body:
    | { operation: 'UPDATE'; update: Partial<SharepointConfiguration> }
    | { operation: 'REPLACE'; configuration: SharepointConfiguration },
): SagaIterator {
  const url: string = yield select(selectConfigurationUrl);
  const token: string = yield call(getAccessToken);
  const { data } = yield call(axios.patch, url, body, {
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
  yield put(updateSharepointConfigurationSuccess(toSharepointConfiguration(data?.latest?.configuration)));
}

// Configuration Service UPDATE merges nested objects, so removing an entry needs a REPLACE of the whole document.
function* replaceSharepointConfiguration(change: Partial<SharepointConfiguration>): SagaIterator {
  const current: SharepointConfiguration = yield select((state: RootState) => ({
    connections: state.sharepoint.connections,
    destinations: state.sharepoint.destinations,
  }));
  yield call(patchSharepointConfiguration, { operation: 'REPLACE', configuration: { ...current, ...change } });
}

export function* fetchSharepointConfigurationSaga(): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Loading...' }));
  try {
    const url: string = yield select(selectConfigurationUrl);
    const token: string = yield call(getAccessToken);
    const { data } = yield call(axios.get, url, { headers: { Authorization: `Bearer ${token}` } });
    const latest = data?.latest || data || {};
    yield put(fetchSharepointConfigurationSuccess(toSharepointConfiguration(latest.configuration)));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* updateSharepointConnectionSaga({
  payload: { connection, clientSecret },
}: UpdateSharepointConnectionAction): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Saving...' }));
  try {
    const connections: Record<string, SharepointConnection> = yield select(
      (state: RootState) => state.sharepoint.connections,
    );
    yield call(patchSharepointConfiguration, {
      operation: 'UPDATE',
      update: { connections: { ...connections, [connection.id]: connection } },
    });

    if (clientSecret) {
      const url: string = yield select(selectSharepointApiUrl(credentialPath(connection.id)));
      const token: string = yield call(getAccessToken);
      const { data } = yield call(axios.put, url, { clientSecret }, { headers: { Authorization: `Bearer ${token}` } });
      yield put(fetchSharepointCredentialStatusSuccess(connection.id, data));
    }
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* deleteSharepointConnectionSaga({ id }: DeleteSharepointConnectionAction): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Saving...' }));
  try {
    const url: string = yield select(selectSharepointApiUrl(credentialPath(id)));
    const token: string = yield call(getAccessToken);
    yield call(axios.delete, url, { headers: { Authorization: `Bearer ${token}` } });

    const connections: Record<string, SharepointConnection> = yield select(
      (state: RootState) => state.sharepoint.connections,
    );
    yield call(replaceSharepointConfiguration, { connections: without(connections, id) });
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* updateSharepointDestinationSaga({
  payload,
  verifyAfterSave,
}: UpdateSharepointDestinationAction): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Saving...' }));
  try {
    yield call(saveDestination, payload);
    if (verifyAfterSave) {
      yield put(verifySharepointDestination(payload.id));
    }
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
    if (verifyAfterSave) {
      yield put(verifySharepointDestinationSuccess(payload.id, { errorCode: 'adsp:save-failed' }));
    }
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

function* saveDestination(destination: SharepointDestination): SagaIterator {
  const destinations: Record<string, SharepointDestination> = yield select(
    (state: RootState) => state.sharepoint.destinations,
  );
  yield call(patchSharepointConfiguration, {
    operation: 'UPDATE',
    update: { destinations: { ...destinations, [destination.id]: destination } },
  });
}

const errorCodeOf = (err): string => {
  const status = err?.response?.status;
  return err?.response?.data?.errorCode ?? (status ? `adsp:http-${status}` : 'adsp:unreachable');
};

function* postDestinationAction(id: string, action: 'verify' | 'setup'): SagaIterator {
  const url: string = yield select(selectSharepointApiUrl(`/destinations/${encodeURIComponent(id)}/${action}`));
  const token: string = yield call(getAccessToken);
  const { data } = yield call(axios.post, url, {}, { headers: { Authorization: `Bearer ${token}` } });
  return data;
}

export function* verifySharepointDestinationSaga({ id }: VerifySharepointDestinationAction): SagaIterator {
  try {
    const report: SharepointVerifyReport = yield call(postDestinationAction, id, 'verify');
    yield put(verifySharepointDestinationSuccess(id, { report }));
  } catch (err) {
    yield put(verifySharepointDestinationSuccess(id, { errorCode: errorCodeOf(err) }));
  }
}

export function* setUpSharepointDestinationSaga({ id }: SetUpSharepointDestinationAction): SagaIterator {
  try {
    const data: SharepointSetupSummary & { report: SharepointVerifyReport } = yield call(
      postDestinationAction,
      id,
      'setup',
    );
    const { report, ...setup } = data;

    if (setup.createdLists.length || setup.createdLibrary) {
      const destination: SharepointDestination = yield select((state: RootState) => state.sharepoint.destinations[id]);
      yield call(saveDestination, {
        ...destination,
        detailLists: (destination.detailLists ?? []).map((list, index) => {
          const created = setup.createdLists.find((candidate) => candidate.index === index);
          return created ? { ...list, listId: created.listId } : list;
        }),
        ...(setup.createdLibrary ? { documentFilesLibraryId: setup.createdLibrary.libraryId } : {}),
      });
    }
    yield put(setUpSharepointDestinationSuccess(id, { report, setup }));
  } catch (err) {
    const report: SharepointVerifyReport | undefined = yield select(
      (state: RootState) => state.sharepoint.verifyResults[id]?.report,
    );
    if (err?.response?.data?.errorCode === 'list-name-taken') {
      yield put(setUpSharepointDestinationSuccess(id, { report, listNameTaken: err.response.data.lists }));
    } else {
      yield put(setUpSharepointDestinationSuccess(id, { report, errorCode: errorCodeOf(err) }));
    }
  }
}

export function* deleteSharepointDestinationSaga({ id }: DeleteSharepointDestinationAction): SagaIterator {
  yield put(UpdateIndicator({ show: true, message: 'Saving...' }));
  try {
    const destinations: Record<string, SharepointDestination> = yield select(
      (state: RootState) => state.sharepoint.destinations,
    );
    yield call(replaceSharepointConfiguration, { destinations: without(destinations, id) });
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  } finally {
    yield put(UpdateIndicator({ show: false }));
  }
}

export function* fetchSharepointCredentialStatusSaga({ id }: FetchSharepointCredentialStatusAction): SagaIterator {
  try {
    const url: string = yield select(selectSharepointApiUrl(credentialPath(id)));
    const token: string = yield call(getAccessToken);
    const { data } = yield call(axios.get, url, { headers: { Authorization: `Bearer ${token}` } });
    yield put(fetchSharepointCredentialStatusSuccess(id, data));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
  }
}

export function* testSharepointDestinationSaga({ id, data }: TestSharepointDestinationAction): SagaIterator {
  try {
    const url: string = yield select(selectSharepointApiUrl(`/destinations/${encodeURIComponent(id)}/test`));
    const token: string = yield call(getAccessToken);
    const { data: result } = yield call(axios.post, url, data, { headers: { Authorization: `Bearer ${token}` } });
    yield put(testSharepointDestinationSuccess(id, result));
  } catch (err) {
    const status = err?.response?.status;
    yield put(
      testSharepointDestinationSuccess(id, {
        ok: false,
        errorCode: status ? `adsp:http-${status}` : 'adsp:unreachable',
      }),
    );
  }
}

interface FormDefinitionResult {
  id: string;
  latest?: {
    configuration?: {
      id?: string;
      name?: string;
      sharepointConfigurationId?: string | null;
      dataSchema?: Record<string, unknown>;
    };
  } | null;
}

// Every form, page by page, so the picker can find any of them; Configuration Service allows 1000 per page.
export function* fetchSharepointFormsSaga(): SagaIterator {
  try {
    const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
    const token: string = yield call(getAccessToken);
    const forms: SharepointFormChoice[] = [];
    let after: string | undefined;
    do {
      const { data } = yield call(axios.get, `${baseUrl}/configuration/v2/configuration/form-service`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { top: 1000, ...(after ? { after } : {}) },
      });
      for (const { id, latest } of (data?.results ?? []) as FormDefinitionResult[]) {
        const configuration = latest?.configuration;
        if (configuration) {
          forms.push({
            id: configuration.id ?? id,
            name: configuration.name ?? id,
            ...(configuration.sharepointConfigurationId
              ? { sharepointConfigurationId: configuration.sharepointConfigurationId }
              : {}),
            dataSchema: configuration.dataSchema,
          });
        }
      }
      after = data?.page?.next;
    } while (after);
    yield put(fetchSharepointFormsSuccess(forms));
  } catch (err) {
    yield put(ErrorNotification({ error: err }));
    yield put(fetchSharepointFormsSuccess([]));
  }
}

export function* watchSharepointSagas(): Generator {
  yield takeEvery(FETCH_SHAREPOINT_FORMS_ACTION, fetchSharepointFormsSaga);
  yield takeEvery(FETCH_SHAREPOINT_CONFIGURATION_ACTION, fetchSharepointConfigurationSaga);
  yield takeEvery(UPDATE_SHAREPOINT_CONNECTION_ACTION, updateSharepointConnectionSaga);
  yield takeEvery(DELETE_SHAREPOINT_CONNECTION_ACTION, deleteSharepointConnectionSaga);
  yield takeEvery(UPDATE_SHAREPOINT_DESTINATION_ACTION, updateSharepointDestinationSaga);
  yield takeEvery(DELETE_SHAREPOINT_DESTINATION_ACTION, deleteSharepointDestinationSaga);
  yield takeEvery(FETCH_SHAREPOINT_CREDENTIAL_STATUS_ACTION, fetchSharepointCredentialStatusSaga);
  yield takeEvery(TEST_SHAREPOINT_DESTINATION_ACTION, testSharepointDestinationSaga);
  yield takeEvery(VERIFY_SHAREPOINT_DESTINATION_ACTION, verifySharepointDestinationSaga);
  yield takeEvery(SET_UP_SHAREPOINT_DESTINATION_ACTION, setUpSharepointDestinationSaga);
}
