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
  DeleteScriptAction,
  DeleteScriptSuccess,
  DELETE_SCRIPT_ACTION,
  UpdateIndicator,
  RUN_SCRIPT_ACTION,
  RunScriptAction,
  UpdateScript,
} from './actions';
import { ActionState } from '@store/session/models';
import { ScriptApi } from './api';
import { TenantApi } from '../tenant/api';

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
        yield put(ExecuteScript(payload));
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
    UpdateIndicator({
      details,
    })
  );

  console.log(JSON.stringify(details) + '<details');
  yield put(UpdateScript(action.payload, true));
}

export function* executeScript(action: RunScriptAction): SagaIterator {
  const scriptUrl: string = yield select((state: RootState) => state.config.serviceUrls?.scriptServiceApiUrl);
  const serviceUrls: string = yield select((state: RootState) => state.config.serviceUrls);
  const token: string = yield call(getAccessToken);
  console.log(JSON.stringify(scriptUrl) + '<scriptUrlxx');
  console.log(JSON.stringify(serviceUrls) + '<serviceUrls');
  console.log(JSON.stringify(token) + '<token');
  if (scriptUrl && token) {
    try {
      console.log(JSON.stringify(scriptUrl) + '<scriptUrl');
      console.log(JSON.stringify(action.payload) + '<action.payload');
      console.log(
        JSON.stringify(`${scriptUrl}/script/v1/scripts/${action.payload?.id}`) +
          '<`${scriptUrl}/script/v1/scripts/${action.payload}`'
      );
      //const state: RootState = yield select();
      // const scriptId = action.payload;

      // const api = new ScriptApi(`${scriptUrl}`, token);
      //const tenantApi = new TenantApi(state.config.tenantApi, token);
      //      const response = yield call([api, api.runScript], scriptId);

      //const response2 = yield call([tenantApi, tenantApi.createTenant], scriptId);

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
      yield put(runScriptSuccess(response?.data));

      details[action.type] = ActionState.completed;
      yield put(
        UpdateIndicator({
          details,
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
        UpdateIndicator({
          details,
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
}
