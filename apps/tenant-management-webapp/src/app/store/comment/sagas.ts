import { SagaIterator } from '@redux-saga/core';
import { fetchServiceMetrics } from '@store/common';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';
import { UpdateIndicator, UpdateElementIndicator } from '@store/session/actions';
import { put, select, call, all, takeEvery, takeLatest } from 'redux-saga/effects';
import axios from 'axios';
import { RootState } from '../index';
import {
  UpdateCommentTopicTypesAction,
  getCommentTopicTypesSuccess,
  deleteCommentTopicTypeSuccess,
  updateCommentTopicTypesSuccess,
  FETCH_COMMENT_TOPIC_TYPES_ACTION,
  UPDATE_COMMENT_TOPIC_TYPE_ACTION,
  DELETE_COMMENT_TOPIC_TYPE_ACTION,
  DeleteCommentTopicTypeAction,
  CREATE_COMMENT_TOPIC_ACTION,
  FETCH_COMMENT_TOPICS_ACTION,
  FETCH_COMMENT_TOPIC_COMMENTS,
  CREATE_COMMENT_COMMENTS_ACTION,
  DELETE_COMMENT_TOPIC_ACTION,
  DELETE_COMMENT,
  UPDATE_COMMENT_COMMENTS_ACTION,
  CLEAR_COMMENT_COMMENTS_ACTION,
  addTopicSuccess,
  setTopics,
  addCommentSuccess,
  updateCommentSuccess,
  fetchCommentSuccess,
  deleteTopicSuccess,
  deleteCommentSuccess,
  AddTopicRequestAction,
  getCommentTopicTypes,
  FETCH_COMMENT_METRICS,
  fetchCommentMetricsSucceeded,
} from './action';
import {
  updateCommentTopicTypesApi,
  deleteCommentTopicTypesApi,
  addTopicApi,
  fetchTopicsApi,
  addCommentApi,
  deleteTopicApi,
  deleteCommentApi,
  fetchCommentsApi,
  updateCommentApi,
} from './api';
import { UpdateCommentConfig, DeleteCommentConfig } from './model';

export function* fetchCommentTopicTypes(): SagaIterator {
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
      const { TopicTypes, core } = yield all({
        TopicTypes: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/comment-service/latest`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        core: call(axios.get, `${configBaseUrl}/configuration/v2/configuration/platform/comment-service/latest?core`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      });
      yield put(getCommentTopicTypesSuccess({ TopicTypes: TopicTypes.data, core: core.data }));
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

export function* updateCommentTopicTypes({ topicType }: UpdateCommentTopicTypesAction): SagaIterator {
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
      yield put(getCommentTopicTypes());
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

function* addTopicSaga({ payload }: AddTopicRequestAction): SagaIterator {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Creating Topic...',
    })
  );
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.commentServiceApiUrl);
  const token = yield call(getAccessToken);

  try {
    const url = `${baseUrl}/comment/v1/topics`;
    const newTopic = yield call(addTopicApi, token, url, payload);
    yield put(addTopicSuccess(newTopic));

    yield put(UpdateIndicator({ show: false }));
  } catch (error) {
    yield put(ErrorNotification(error.toString()));

    yield put(UpdateIndicator({ show: false }));
  }
}

function* fetchTopicsSaga(payload): SagaIterator {
  const baseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.commentServiceApiUrl);
  const token = yield call(getAccessToken);
  const next = payload.next ? payload.next : '';
  yield put(
    UpdateIndicator({
      show: next === '',
      message: 'Loading Topics...',
    })
  );

  try {
    const url = encodeURI(
      `${baseUrl}/comment/v1/topics?top=10&after=${next}&criteria=${'{"typeIdEquals":"' + payload.payload.id + '"}'}`
    );
    const { results, page } = yield call(fetchTopicsApi, url, token);
    yield put(setTopics(results, page.after, page.next));
    yield put(UpdateIndicator({ show: false }));
  } catch (error) {
    yield put(ErrorNotification(error.toString()));
    yield put(UpdateIndicator({ show: false }));
  }
}

function* clearCommentSaga(): SagaIterator {
  yield put(fetchCommentSuccess([], '', ''));
}
function* fetchCommentSaga(action): SagaIterator {
  yield put(
    UpdateElementIndicator({
      show: true,
    })
  );
  const baseUrl = yield select((state) => state.config.serviceUrls?.commentServiceApiUrl);
  const token = yield call(getAccessToken);
  const next = action.next ? action.next : '';

  try {
    const url = `${baseUrl}/comment/v1/topics/${action.payload}/comments?top=10&after=${next}`;
    const { results, page } = yield call(fetchCommentsApi, token, url);
    yield put(fetchCommentSuccess(results, page.after, page.next));
    yield put(
      UpdateElementIndicator({
        show: false,
      })
    );
  } catch (error) {
    yield put(ErrorNotification(error.toString()));

    yield put(
      UpdateElementIndicator({
        show: false,
      })
    );
  }
}
function* addCommentSaga(action): SagaIterator {
  const baseUrl = yield select((state) => state.config.serviceUrls?.commentServiceApiUrl);
  const token = yield call(getAccessToken);
  const id = action.payload?.topicId ? action.payload.topicId : action.payload?.id;

  try {
    const url = `${baseUrl}/comment/v1/topics/${id}/comments`;
    const newComment = yield call(addCommentApi, token, url, action.payload);
    yield put(addCommentSuccess(newComment, '', ''));
  } catch (error) {
    yield put(ErrorNotification(error.toString()));
  }
}
function* updateCommentSaga(action): SagaIterator {
  const baseUrl = yield select((state) => state.config.serviceUrls?.commentServiceApiUrl);
  const token = yield call(getAccessToken);

  try {
    const url = `${baseUrl}/comment/v1/topics/${action.payload.topicId}/comments/${action.payload.comment.id}`;
    const newComment = yield call(updateCommentApi, token, url, action.payload.comment);
    yield put(updateCommentSuccess(newComment, '', ''));
  } catch (error) {
    yield put(ErrorNotification(error.toString()));
  }
}

function* deleteTopicSaga(action): SagaIterator {
  const baseUrl = yield select((state) => state.config.serviceUrls?.commentServiceApiUrl);
  const token = yield call(getAccessToken);

  try {
    const url = `${baseUrl}/comment/v1/topics/${action.payload}`;
    yield call(deleteTopicApi, token, url);
    yield put(deleteTopicSuccess(action.payload));
  } catch (error) {
    yield put(ErrorNotification(error.toString()));
  }
}

function* deleteCommentSaga(action): SagaIterator {
  const baseUrl = yield select((state) => state.config.serviceUrls?.commentServiceApiUrl);
  const token = yield call(getAccessToken);

  try {
    const url = `${baseUrl}/comment/v1/topics/${action.payload.topicId}/comments/${action.payload.comment}`;
    yield call(deleteCommentApi, token, url);
    yield put(deleteCommentSuccess(action.payload));
  } catch (error) {
    yield put(ErrorNotification(error.toString()));
  }
}

export function* fetchCommentMetrics(): SagaIterator {
  yield* fetchServiceMetrics('comment-service', function* (metrics) {
    const topicsMetric = 'comment-service:topic-created:count';
    const commentsMetric = 'comment-service:comment-created:count';

    yield put(
      fetchCommentMetricsSucceeded({
        topicsCreated: parseInt(metrics[topicsMetric]?.values[0]?.sum || '0', 10),
        commentsCreated: parseInt(metrics[commentsMetric]?.values[0]?.sum || '0', 10),
      })
    );
  });
}

export function* watchCommentSagas(): Generator {
  yield takeEvery(FETCH_COMMENT_TOPIC_TYPES_ACTION, fetchCommentTopicTypes);
  yield takeEvery(UPDATE_COMMENT_TOPIC_TYPE_ACTION, updateCommentTopicTypes);
  yield takeEvery(DELETE_COMMENT_TOPIC_TYPE_ACTION, deleteCommentTopicTypes);
  yield takeEvery(CREATE_COMMENT_TOPIC_ACTION, addTopicSaga);
  yield takeEvery(FETCH_COMMENT_TOPICS_ACTION, fetchTopicsSaga);
  yield takeEvery(CREATE_COMMENT_COMMENTS_ACTION, addCommentSaga);
  yield takeEvery(CLEAR_COMMENT_COMMENTS_ACTION, clearCommentSaga);
  yield takeEvery(UPDATE_COMMENT_COMMENTS_ACTION, updateCommentSaga);
  yield takeEvery(FETCH_COMMENT_TOPIC_COMMENTS, fetchCommentSaga);
  // yield takeEvery(FETCH_COMMENTS, addCommentSaga);
  yield takeEvery(DELETE_COMMENT_TOPIC_ACTION, deleteTopicSaga);
  yield takeEvery(DELETE_COMMENT, deleteCommentSaga);
  yield takeLatest(FETCH_COMMENT_METRICS, fetchCommentMetrics);
}
