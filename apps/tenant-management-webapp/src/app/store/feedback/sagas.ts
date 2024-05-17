import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeLatest } from 'redux-saga/effects';
import axios from 'axios';

import {
  DELETE_FEEDBACK_SITE_ACTION,
  DeleteFeedbackSiteAction,
  deleteFeedbackSiteSuccess,
  FETCH_FEEDBACK_SITES_ACTION,
  UPDATE_FEEDBACK_SITE_ACTION,
  UpdateFeedbackSiteAction,
  getFeedbackSitesSuccess,
  updateFeedbackSiteSuccess,
} from './actions';

import { getAccessToken } from '@store/tenant/sagas';

function* fetchFeedbackSites() {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Feedback Sites...',
    })
  );
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const url = `${configBaseUrl}/configuration/v2/configuration/platform/feedback-service/latest`;
  const headers = {
    headers: { Authorization: `Bearer ${token}` },
  };

  if (configBaseUrl && token) {
    try {
      const response = yield call(axios.get, url, headers);
      yield put(getFeedbackSitesSuccess(response.data.sites));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (error) {
      yield put({ type: 'FETCH_FEEDBACK_SITES_FAILURE', error });
    }
  }
}
function* updateFeedbackSite(request: UpdateFeedbackSiteAction) {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Feedback Sites...',
    })
  );
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const token: string = yield call(getAccessToken);
  const url = `${configBaseUrl}/configuration/v2/configuration/platform/feedback-service`;
  const headers = {
    headers: { Authorization: `Bearer ${token}` },
  };

  if (configBaseUrl && token) {
    const requestpayload = {
      operation: 'UPDATE',
      update: {
        sites: [request.site],
      },
    };
    try {
      const response = yield call(axios.patch, url, requestpayload, headers);
      yield put(updateFeedbackSiteSuccess(response.data.latest.configuration.sites));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (error) {
      yield put({ type: 'FETCH_FEEDBACK_SITES_FAILURE', error });
    }
  }
}
function* deleteFeedbackSite(action: DeleteFeedbackSiteAction) {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Deleting Feedback Site...',
    })
  );
  const configBaseUrl: string = yield select(
    (state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl
  );
  const sites = yield select((state: RootState) => state.feedback.sites);
  const filteredSites = sites.filter((s) => s.url !== action.site.url);
  const token: string = yield call(getAccessToken);
  const url = `${configBaseUrl}/configuration/v2/configuration/platform/feedback-service`;
  const headers = {
    headers: { Authorization: `Bearer ${token}` },
  };

  if (configBaseUrl && token) {
    try {
      yield call(axios.patch, url, { operation: 'REPLACE', configuration: { sites: filteredSites } }, headers);
      yield put(deleteFeedbackSiteSuccess(action.site.url));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (error) {
      yield put({ type: 'DELETE_FEEDBACK_SITE_FAILURE', error });
    }
  }
}

export function* watchFeedbackSagas(): Generator {
  yield takeLatest(FETCH_FEEDBACK_SITES_ACTION, fetchFeedbackSites);
  yield takeLatest(UPDATE_FEEDBACK_SITE_ACTION, updateFeedbackSite);
  yield takeLatest(DELETE_FEEDBACK_SITE_ACTION, deleteFeedbackSite);
}
