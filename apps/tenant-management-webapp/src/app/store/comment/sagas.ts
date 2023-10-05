import { SagaIterator } from '@redux-saga/core';
import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeEvery } from 'redux-saga/effects';
import { ErrorNotification } from '@store/notifications/actions';
import {
  UpdateCommentTopicTypesAction,
  getCommentTopicTypesSuccess,
  deleteCommentTopicTypeSuccess,
  updateCommentTopicTypesSuccess,
  FETCH_COMMENT_TOPIC_TYPES_ACTION,
  UPDATE_COMMENT_TOPIC_TYPE_ACTION,
  DELETE_COMMENT_TOPIC_TYPE_ACTION,
  DeleteCommentTopicTypeAction,
} from './action';

import { getAccessToken } from '@store/tenant/sagas';
import { UpdateCommentConfig, DeleteCommentConfig } from './model';
import { fetchCommentTopicTypesApi, updateCommentTopicTypesApi, deleteCommentTopicTypesApi } from './api';

export function* fetchCommentTopicTypess(): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Topic types...',
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
      yield put(ErrorNotification({ error: err }));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    }
  }
}

export function* updateCommentTopicTypes({ topicType, options }: UpdateCommentTopicTypesAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const CommentTopicTypes = {
        [topicType.id]: {
          ...topicType,
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
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* deleteCommentTopicTypes({ topicTypeId }: DeleteCommentTopicTypeAction): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const payload: DeleteCommentConfig = { operation: 'DELETE', property: topicTypeId };
      const url = `${baseUrl}/configuration/v2/configuration/platform/comment-service`;
      const { latest } = yield call(deleteCommentTopicTypesApi, token, url, payload);

      yield put(
        deleteCommentTopicTypeSuccess({
          ...latest.configuration,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* watchCommentSagas(): Generator {
  yield takeEvery(FETCH_COMMENT_TOPIC_TYPES_ACTION, fetchCommentTopicTypess);
  yield takeEvery(UPDATE_COMMENT_TOPIC_TYPE_ACTION, updateCommentTopicTypes);
  yield takeEvery(DELETE_COMMENT_TOPIC_TYPE_ACTION, deleteCommentTopicTypes);
}
