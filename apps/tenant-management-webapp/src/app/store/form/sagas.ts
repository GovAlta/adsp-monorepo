import { SagaIterator } from '@redux-saga/core';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { RootState } from '../index';

import {
  FETCH_ALL_TAGS_ACTION,
  fetchAllTagsSuccess,
  fetchAllTagsFailed,
} from './action';

import { FormResourceTagResult, Tag } from './model';
import { getAllTagsApi } from '@store/directory/api';


export function* fetchAllTags(): SagaIterator {
  try {
    const state: RootState = yield select();
    const baseUrl: string = state.config.serviceUrls?.directoryServiceApiUrl || '';
    const token: string = yield call(getAccessToken);

    if (baseUrl && token) {
      const { results } = yield call(getAllTagsApi, token, baseUrl);
      const tags: Tag[] = results.map((tag: FormResourceTagResult) => ({
        urn: tag.urn,
        label: tag.label,
        value: tag.value.toLowerCase(),
        _links: tag._links,
      }));

      yield put(fetchAllTagsSuccess(tags));
    } else {
      throw new Error('Missing token or base URL');
    }
  } catch (err) {
    yield put(fetchAllTagsFailed(err.message));
    yield put(ErrorNotification({ message: 'Failed to fetch tags', error: err }));
  }
}


export function* watchFormSagas(): Generator {
  yield takeEvery(FETCH_ALL_TAGS_ACTION, fetchAllTags);
}
