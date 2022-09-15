import axios from 'axios';
import { SagaIterator } from '@redux-saga/core';

import { RootState } from '..';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';

import { getAccessToken } from '@store/tenant/sagas';
import {
  UpdateScriptAction,
  UpdateScriptSuccess,
  UPDATE_SCRIPT_ACTION,
  FETCH_SCRIPTS_ACTION,
  FetchScriptsAction,
  fetchScriptsSuccess,
  UpdateIndicator,
} from './actions';
import { ActionState } from '@store/session/models';

export function* updateScript({ payload }: UpdateScriptAction): SagaIterator {
  const script = { [payload.name]: { ...payload } };
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
      yield put(
        UpdateScriptSuccess({
          ...latest.configuration,
        })
      );
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
export function* watchScriptSagas(): Generator {
  yield takeEvery(UPDATE_SCRIPT_ACTION, updateScript);
  yield takeEvery(FETCH_SCRIPTS_ACTION, fetchScripts);
}
