import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { ErrorNotification } from '@store/notifications/actions';

import { getAccessToken } from '@store/tenant/sagas';
import { select, call, put, takeEvery, all } from 'redux-saga/effects';
import { RootState } from '../index';

import {
  getCacheTargetsSuccess,
  FETCH_CACHE_DEFINITIONS_ACTION,
  UpdateCacheTargetAction,
  updateCacheTargetSuccess,
  UPDATE_CACHE_TARGETS_ACTION,
} from './action';
import {} from './action';
import { fetchCacheTargetsApi, updateCacheTargetApi } from './api';

export function* fetchCacheTargets(payload): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const next = payload.next ?? '';
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/platform/cache-service?top=50&after=${next}`;
      const coreUrl = `${configBaseUrl}/configuration/v2/configuration/platform/cache-service?core`;
      yield put(
        UpdateIndicator({
          show: true,
        })
      );

      const { tenant, core } = yield all({
        tenant: call(fetchCacheTargetsApi, token, url),
        core: call(fetchCacheTargetsApi, token, coreUrl),
      });

      const targets = tenant.latest ? tenant.latest.configuration?.targets : {};
      const coreTargets = core.latest ? core.latest.configuration?.targets : {};
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
      yield put(getCacheTargetsSuccess({ tenant: targets, core: coreTargets }));
    } catch (err) {
      yield put(ErrorNotification({ message: 'Failed to fetch cache targets', error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* updateCacheTargets({ definition }: UpdateCacheTargetAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { latest } = yield call(updateCacheTargetApi, token, baseUrl, definition);

      yield put(updateCacheTargetSuccess(latest.configuration.targets));
    } catch (err) {
      yield put(ErrorNotification({ message: 'Failed to update cache targets', error: err }));
    }
  }
}

export function* watchCacheSagas(): Generator {
  yield takeEvery(FETCH_CACHE_DEFINITIONS_ACTION, fetchCacheTargets);
  yield takeEvery(UPDATE_CACHE_TARGETS_ACTION, updateCacheTargets);
}
