import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { ErrorNotification } from '@store/notifications/actions';

import { getAccessToken } from '@store/tenant/sagas';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { RootState } from '../index';

import { getCacheTargetsSuccess, FETCH_CACHE_DEFINITIONS_ACTION } from './action';
import { fetchCacheTargetsApi } from './api';

export function* fetchCacheTargets(payload): SagaIterator {
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const next = payload.next ?? '';
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/cache-service?top=50&after=${next}`;
      const { results, page } = yield call(fetchCacheTargetsApi, token, url);
      yield put(
        UpdateIndicator({
          show: true,
        })
      );
      console.log(JSON.stringify(url) + '><url');
      console.log(JSON.stringify(results) + '><results');
      const targets = results.reduce((acc, def) => {
        if (def.latest?.configuration?.id) {
          acc[def.latest.configuration.id] = def.latest.configuration;
        } else {
          acc[def.id] = def.latest.configuration;
        }

        return acc;
      }, {});

      console.log(JSON.stringify(targets) + '><targets');
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
      yield put(getCacheTargetsSuccess(targets, page.next, page.after));
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

export function* watchCacheSagas(): Generator {
  yield takeEvery(FETCH_CACHE_DEFINITIONS_ACTION, fetchCacheTargets);
}
