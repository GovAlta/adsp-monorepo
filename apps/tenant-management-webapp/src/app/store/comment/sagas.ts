import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import {
  UpdateCommentTopicTypesAction,
  getCommentTopicTypesSuccess,
  updateCommentTopicTypesSuccess,
  FETCH_COMMENT_TOPIC_TYPES_ACTION,
  UPDATE_COMMENT_TOPIC_TYPE_ACTION,
} from './action';

import { getAccessToken } from '@store/tenant/sagas';
import { UpdateCommentConfig } from './model';
import { fetchCommentTopicTypesApi, updateCommentTopicTypesApi } from './api';

export function* fetchCommentTopicTypess(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading TopicTypes...',
    })
  );

  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  if (configBaseUrl && token) {
    try {
      const url = `${configBaseUrl}/configuration/v2/configuration/platform/comment-service/latest`;
      const TopicTypess = yield call(fetchCommentTopicTypesApi, token, url);
      yield put(getCommentTopicTypesSuccess(TopicTypess));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* updateCommentTopicTypes({ definition, options }: UpdateCommentTopicTypesAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const CommentTopicTypes = {
        [definition.id]: {
          ...definition,
        },
      };

      const body: UpdateCommentConfig = { operation: 'UPDATE', update: { ...CommentTopicTypes } };
      const url = `${baseUrl}/configuration/v2/configuration/platform/comment-service`;
      const { latest } = yield call(updateCommentTopicTypesApi, token, url, body);

      yield put(
        updateCommentTopicTypesSuccess({
          ...latest.configuration,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* watchCommentSagas(): Generator {
  yield takeEvery(FETCH_COMMENT_TOPIC_TYPES_ACTION, fetchCommentTopicTypess);
  yield takeEvery(UPDATE_COMMENT_TOPIC_TYPE_ACTION, updateCommentTopicTypes);
}
