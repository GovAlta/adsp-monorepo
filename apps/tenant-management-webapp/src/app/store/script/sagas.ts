import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';

import { RootState } from '..';
import { select, put, takeEvery } from 'redux-saga/effects';

import * as Effects from 'redux-saga/effects';

import { ErrorNotification } from '@store/notifications/actions';

import { getAccessToken } from '@store/tenant/sagas';
import {
  UpdateScriptAction,
  UpdateScriptSuccess,
  UPDATE_SCRIPT_ACTION,
  FETCH_SCRIPTS_ACTION,
  EXECUTE_SCRIPT_ACTION,
  FetchScriptsAction,
  fetchScriptsSuccess,
  runScriptSuccess,
  ExecuteScript,
  WipeCache,
  DeleteScriptAction,
  DeleteScriptSuccess,
  DELETE_SCRIPT_ACTION,
  RUN_SCRIPT_ACTION,
  RunScriptAction,
  UpdateScript,
  UpdateIndicator,
  WIPE_CACHE_SCRIPT_ACTION,
} from './actions';
import { ActionState } from '@store/session/models';
import { UpdateIndicator as UpdateIndicatorSession } from '@store/session/actions';

const call: any = Effects.call;

export function* updateScript({ payload, executeOnCompletion }: UpdateScriptAction): SagaIterator {
  const script = { [payload.id]: { ...payload } };
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

  console.log(JSON.stringify(payload) + '<payloadxxx');

  if (configBaseUrl && token) {
    try {
      const {
        data: { latest },
      } = yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/script-service`,
        {
          operation: 'UPDATE',
          update: { ...script },
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (executeOnCompletion) {
        yield put(WipeCache(payload));
      } else {
        yield put(
          UpdateScriptSuccess({
            ...latest.configuration,
          })
        );
      }
    } catch (e) {
      yield put(ErrorNotification({ message: `${e.message} - updateScript` }));
    }
  }
}
export function* fetchScripts(action: FetchScriptsAction): SagaIterator {
  const details = {};
  details[action.type] = ActionState.inProcess;
  yield put(
    UpdateIndicator({
      details,
    })
  );
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const { data } = yield call(
        axios.get,
        `${configBaseUrl}/configuration/v2/configuration/platform/script-service/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      yield put(fetchScriptsSuccess(data));

      details[action.type] = ActionState.completed;
      yield put(
        UpdateIndicator({
          details,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
      details[action.type] = ActionState.error;
      yield put(
        UpdateIndicator({
          details,
        })
      );
    }
  }
}

const details = {};

export function* runScript(action: RunScriptAction): SagaIterator {
  console.log(JSON.stringify(action) + '<action');

  details[action.type] = ActionState.inProcess;

  yield put(
    UpdateIndicatorSession({
      show: true,
      message: 'Loading...',
    })
  );

  console.log(JSON.stringify(details) + '<details');
  yield put(UpdateScript(action.payload, true));
}

export function* wipeCache(action: RunScriptAction): SagaIterator {
  const scriptUrl: string = yield select((state: RootState) => state.config.serviceUrls?.scriptServiceApiUrl);
  const token: string = yield call(getAccessToken);
  if (scriptUrl && token) {
    try {
      console.log(JSON.stringify(scriptUrl) + '<scriptUrl');
      console.log(JSON.stringify(action.payload) + '<action.payload');

      const response = yield call(axios.get, `${scriptUrl}/script/v1/scripts/clearCache`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      console.log(JSON.stringify(response) + '<wipecacheresponse');
      console.log(JSON.stringify(response.response?.data) + '<Response2');

      yield put(ExecuteScript(action.payload));
    } catch (err) {
      console.log(JSON.stringify(err.message) + '<err');
      console.log(JSON.stringify(err?.response?.data) + '<err.message22');
      console.log(JSON.stringify(err?.response) + '<err.message23');
      if (err.message) {
        yield put(runScriptSuccess(err.message));
      } else {
        yield put(ErrorNotification({ message: err.message }));
        details[action.type] = ActionState.error;
      }

      yield put(
        UpdateIndicatorSession({
          show: false,
        })
      );
    }
  }
}

export function* executeScript(action: RunScriptAction): SagaIterator {
  const scriptUrl: string = yield select((state: RootState) => state.config.serviceUrls?.scriptServiceApiUrl);
  // const serviceUrls: string = yield select((state: RootState) => state.config.serviceUrls);
  const token: string = yield call(getAccessToken);
  console.log(JSON.stringify(scriptUrl) + '<scriptUrlxx');
  //console.log(JSON.stringify(serviceUrls) + '<serviceUrls');
  console.log(JSON.stringify(token) + '<token');
  if (scriptUrl && token) {
    try {
      const response = yield call(
        axios.post,
        `${scriptUrl}/script/v1/scripts/${action.payload?.id}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log(JSON.stringify(response) + '<Response');
      console.log(JSON.stringify(response.response?.data) + '<Response2');
      yield put(runScriptSuccess(response?.data[0]));

      details[action.type] = ActionState.completed;
      yield put(
        UpdateIndicatorSession({
          show: false,
        })
      );
    } catch (err) {
      console.log(JSON.stringify(err) + '<err');
      console.log(JSON.stringify(err?.response?.data.error) + '<err.message22');
      if (err?.response?.data) {
        yield put(runScriptSuccess(err?.response?.data.error));
      } else {
        yield put(ErrorNotification({ message: err.message }));
        details[action.type] = ActionState.error;
      }

      yield put(
        UpdateIndicatorSession({
          show: false,
        })
      );
    }
  }
}

function* deleteScript(action: DeleteScriptAction): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const scriptId = action.scriptId;

  if (configBaseUrl && token) {
    try {
      yield call(
        axios.patch,
        `${configBaseUrl}/configuration/v2/configuration/platform/script-service`,
        { operation: 'DELETE', property: scriptId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      yield put(DeleteScriptSuccess(scriptId));
    } catch (err) {
      yield put(ErrorNotification({ message: `Script (delete script): ${err.message}` }));
    }
  }
}

export function* watchScriptSagas(): Generator {
  yield takeEvery(UPDATE_SCRIPT_ACTION, updateScript);
  yield takeEvery(FETCH_SCRIPTS_ACTION, fetchScripts);
  yield takeEvery(DELETE_SCRIPT_ACTION, deleteScript);
  yield takeEvery(RUN_SCRIPT_ACTION, runScript);
  yield takeEvery(EXECUTE_SCRIPT_ACTION, executeScript);
  yield takeEvery(WIPE_CACHE_SCRIPT_ACTION, wipeCache);
}
