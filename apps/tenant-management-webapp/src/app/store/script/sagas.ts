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
  RUN_SCRIPT_ACTION,
  RunScriptAction,
  UpdateScript,
  UpdateIndicator,
} from './actions';
import { ActionState } from '@store/session/models';
import { UpdateIndicator as UpdateIndicatorSession } from '@store/session/actions';
import { ScriptResponse } from './models';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const call: any = Effects.call;

export function* updateScript({ payload, executeOnCompletion }: UpdateScriptAction): SagaIterator {
  const testInputs = payload['testInputs'] ? payload['testInputs'] : {};
  delete payload['testInputs'];
  const script = { [payload.id]: { ...payload } };
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);

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
        payload['testInputs'] = testInputs;
        yield put(ExecuteScript(payload));
      } else {
        yield put(
          UpdateScriptSuccess({
            ...latest.configuration,
          })
        );
      }
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
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
      yield put(ErrorNotification({ error: err }));
      details[action.type] = ActionState.error;
      yield put(
        UpdateIndicator({
          details,
        })
      );
    }
  }
}

export function* runScript(action: RunScriptAction): SagaIterator {
  yield put(
    UpdateIndicatorSession({
      show: true,
      message: 'Loading...',
    })
  );
  yield put(UpdateScript(action.payload, true));
}

export function* executeScript(action: RunScriptAction): SagaIterator {
  const scriptUrl: string = yield select((state: RootState) => state.config.serviceUrls?.scriptServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const { testInputs, script } = action.payload;
  if (scriptUrl && token) {
    try {
      yield put(
        UpdateIndicatorSession({
          show: true,
        })
      );
      const response = yield call(
        axios.post,
        `${scriptUrl}/script/v1/scripts`,
        {
          inputs: testInputs.inputs,
          script,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const scriptResponse: ScriptResponse = {
        timeToRun: new Date().toLocaleString(),
        inputs: testInputs.inputs,
        result: response?.data[0],
        hasError: false,
      };
      yield put(runScriptSuccess(scriptResponse));
      yield put(
        UpdateIndicatorSession({
          show: false,
        })
      );
    } catch (err) {
      if (err?.response?.data) {
        yield put(
          runScriptSuccess({
            timeToRun: new Date().toLocaleString(),
            inputs: testInputs.inputs,
            result: err?.response?.data.error,
            hasError: true,
          })
        );
      } else {
        yield put(ErrorNotification({ error: err }));
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
      yield put(ErrorNotification({ error: err }));
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
