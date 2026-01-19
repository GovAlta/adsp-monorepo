import { UpdateIndicator } from '@store/session/actions';
import { RootState } from '../index';
import { select, call, put, takeLatest, all } from 'redux-saga/effects';
import axios from 'axios';
import { Feedback } from './models';
import {
  DELETE_FEEDBACK_SITE_ACTION,
  DeleteFeedbackSiteAction,
  deleteFeedbackSiteSuccess,
  FETCH_FEEDBACK_SITES_ACTION,
  UPDATE_FEEDBACK_SITE_ACTION,
  UpdateFeedbackSiteAction,
  getFeedbackSitesSuccess,
  updateFeedbackSiteSuccess,
  getFeedbacksSuccess,
  FETCH_FEEDBACKS_ACTION,
  FetchFeedbacksAction,
  ExportFeedbacksAction,
  exportFeedbacksSuccess,
  EXPORT_FEEDBACKS_ACTION,
  FETCH_FEEDBACK_METRICS_ACTION,
  fetchFeedbackMetricsSuccess,
  FETCH_FEEDBACK_METRICS_MONTHLY_CHANGE_ACTION,
  fetchFeedbackMetricsMonthlyChangeSuccess,
} from './actions';
import { getAccessToken } from '@store/tenant/sagas';
import { SagaIterator } from 'redux-saga';
import moment from 'moment';
import { ErrorNotification } from '@store/notifications/actions';

function* fetchFeedbacks(payload: FetchFeedbacksAction) {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Feedbacks...',
    })
  );
  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const next = payload.next ? payload.next : '';
  const contextData = encodeURI(JSON.stringify({ site: payload.feedback.url }));
  const isWithTimestamp = payload.searchCriteria.startDate && payload.searchCriteria.endDate;
  if (isWithTimestamp) {
    const setEndDateEod = new Date(payload.searchCriteria.endDate);
    setEndDateEod.setUTCHours(25, 59, 59, 999);
    payload.searchCriteria.endDate = setEndDateEod.toISOString();
  }
  const url = `${configBaseUrl}/value/v1/feedback-service/values/feedback?context=${contextData}&top=10&after=${next}${
    isWithTimestamp
      ? `&timestampMin=${payload.searchCriteria.startDate}&timestampMax=${payload.searchCriteria.endDate}`
      : ''
  }`;
  const headers = {
    headers: { Authorization: `Bearer ${token}` },
  };

  if (configBaseUrl && token) {
    try {
      const response = yield call(axios.get, url, headers);
      const feedbacks = response.data['feedback-service'].feedback;
      yield put(
        getFeedbacksSuccess(incrementRatingValue(feedbacks), response.data.page.after, response.data.page.next)
      );
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
      if (payload.resolve) {
        payload.resolve(feedbacks);
      }
    } catch (error) {
      yield put({ type: 'FETCH_FEEDBACKS_FAILURE', error });
      yield put(UpdateIndicator({ show: false }));
    }
  }
}

function* exportFeedbacks(payload: ExportFeedbacksAction) {
  yield put(
    UpdateIndicator({
      show: true,
      message: 'Loading Feedbacks...',
    })
  );

  const configBaseUrl: string = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);
  const contextData = encodeURI(JSON.stringify(payload.site));
  const headers = {
    headers: { Authorization: `Bearer ${token}` },
  };

  if (configBaseUrl && token) {
    let allFeedbacks = [];

    let nextPage: string = '';
    let hasMoreData: boolean = true;
    const pageSize = 5000;

    try {
      while (hasMoreData) {
        const url = `${configBaseUrl}/value/v1/feedback-service/values/feedback?context=${contextData}${
          payload.searchCriteria.startDate && payload.searchCriteria.endDate
            ? `&timestampMin=${payload.searchCriteria.startDate}&timestampMax=${payload.searchCriteria.endDate}`
            : ''
        }&top=${pageSize}${nextPage !== '' ? `&after=${nextPage}` : ''}`;

        const response = yield call(axios.get, url, headers);
        const feedbacks = response.data['feedback-service'].feedback;
        nextPage = response.data?.page?.next ?? null;
        if (!response.data.page.next) {
          hasMoreData = false;
        }

        allFeedbacks = allFeedbacks.concat(feedbacks);

      }

      yield put(exportFeedbacksSuccess(incrementRatingValue(allFeedbacks)));
      yield put(
        UpdateIndicator({
          show: false,
        })
      );
    } catch (error) {
      yield put({ type: 'FETCH_FEEDBACKS_FAILURE', error });
      yield put(UpdateIndicator({ show: false }));
    }
  }
}

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

interface MetricResponse {
  values: { sum: string; avg: string }[];
}

export function* fetchFeedbackMetrics(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().subtract(7, 'day').toISOString(),
      });

      const { data }: { data: Record<string, MetricResponse> } = yield call(
        axios.get,
        `${baseUrl}/value/v1/feedback-service/values/feedback/metrics?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const siteCounts = Object.entries(data)
        .filter(([name]) => name.split(':').length === 3 && name.endsWith(':count'))
        .reduce(
          (counts, [name, value]) => ({
            ...counts,
            [`${name.replace(':count', '')}`]: parseInt(value?.values[0]?.sum || '0'),
          }),
          {} as Record<string, number>
        );
      const siteRatings = Object.entries(data)
        .filter(([name]) => name.split(':').length === 3 && name.endsWith(':rating'))
        .reduce((ratings, [name, value]) => {
          const rating = value?.values[0]?.avg;
          if (rating) {
            ratings.push([name.replace(':rating', ''), parseFloat(rating)]);
          }
          return ratings;
        }, [] as [string, number][]);
      yield put(
        fetchFeedbackMetricsSuccess({
          feedbackCount: Object.values(siteCounts).reduce((count, value) => count + value, 0),
          averageRating:
            siteRatings.length > 0
              ? Math.round(
                  (siteRatings
                    .map(([name, rating]) => rating * (siteCounts[name] || 0))
                    .reduce((total, rating) => total + rating, 0) *
                    10) /
                    Object.values(siteCounts).reduce((total, count) => total + count, 0)
                ) / 10
              : null,
          lowestSiteAverageRating:
            siteRatings.length > 0 ? Math.min(...siteRatings.map(([_, rating]) => rating)) : null,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

export function* fetchFeedbackMetricsMoM(): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const now = moment();
      const startOfThisMonth = now.clone().startOf('month');
      const startOfLastMonth = now.clone().subtract(1, 'month').startOf('month');
      const endOfLastMonth = startOfThisMonth.clone().subtract(1, 'day').endOf('day');

      const criteriaCurrent = JSON.stringify({
        intervalMin: startOfThisMonth.toISOString(),
        intervalMax: now.toISOString(),
      });

      const criteriaPrevious = JSON.stringify({
        intervalMin: startOfLastMonth.toISOString(),
        intervalMax: endOfLastMonth.toISOString(),
      });

      const [currentResp, previousResp]: [
        { data: Record<string, MetricResponse> },
        { data: Record<string, MetricResponse> }
      ] = yield all([
        call(axios.get, `${baseUrl}/value/v1/feedback-service/values/feedback/metrics?criteria=${criteriaCurrent}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        call(axios.get, `${baseUrl}/value/v1/feedback-service/values/feedback/metrics?criteria=${criteriaPrevious}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      const extractCounts = (data: Record<string, MetricResponse>) =>
        Object.entries(data)
          .filter(([name]) => name.split(':').length === 3 && name.endsWith(':count'))
          .reduce((acc, [name, metric]) => {
            acc[name.replace(':count', '')] = parseInt(metric?.values[0]?.sum || '0');
            return acc;
          }, {} as Record<string, number>);

      const extractRatings = (data: Record<string, MetricResponse>) =>
        Object.entries(data)
          .filter(([name]) => name.split(':').length === 3 && name.endsWith(':rating'))
          .reduce((acc, [name, metric]) => {
            const rating = metric?.values[0]?.avg;
            if (rating) {
              acc.push([name.replace(':rating', ''), parseFloat(rating)]);
            }
            return acc;
          }, [] as [string, number][]);

      const getWeightedAverage = (ratings: [string, number][], counts: Record<string, number>) => {
        const total = ratings.reduce((sum, [site, rating]) => sum + rating * (counts[site] || 0), 0);
        const count = ratings.reduce((sum, [site]) => sum + (counts[site] || 0), 0);
        return count > 0 ? Math.round((total * 10) / count) / 10 : null;
      };

      const getLowestRating = (ratings: [string, number][]) =>
        ratings.length ? Math.min(...ratings.map(([, rating]) => rating)) : null;

      // Extract and compute
      const currentCounts = extractCounts(currentResp.data);
      const previousCounts = extractCounts(previousResp.data);

      const currentRatings = extractRatings(currentResp.data);
      const previousRatings = extractRatings(previousResp.data);

      const currentCountTotal = Object.values(currentCounts).reduce((a, b) => a + b, 0);
      const previousCountTotal = Object.values(previousCounts).reduce((a, b) => a + b, 0);

      const currentAvg = getWeightedAverage(currentRatings, currentCounts);
      const previousAvg = getWeightedAverage(previousRatings, previousCounts);

      const currentLowest = getLowestRating(currentRatings);
      const previousLowest = getLowestRating(previousRatings);

      const momCount =
        previousCountTotal > 0 ? ((currentCountTotal - previousCountTotal) / previousCountTotal) * 100 : null;

      const momAvg =
        previousAvg && previousAvg > 0 && currentAvg != null ? ((currentAvg - previousAvg) / previousAvg) * 100 : null;

      const momLowest =
        previousLowest && previousLowest > 0 && currentLowest != null
          ? ((currentLowest - previousLowest) / previousLowest) * 100
          : null;

      yield put(
        fetchFeedbackMetricsMonthlyChangeSuccess({
          momCountPercent: momCount,

          momAvgRatingPercent: momAvg,

          momLowestRatingPercent: momLowest,
        })
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

function incrementRatingValue(feedback: Feedback[]): Feedback[] {
  if (!feedback || !Array.isArray(feedback)) {
    return feedback;
  }
  return feedback.map((entry) => ({
    ...entry,
    value: {
      ...entry.value,
      ratingValue: Number(entry.value?.ratingValue) + 1,
    },
  }));
}
export function* watchFeedbackSagas(): Generator {
  yield takeLatest(FETCH_FEEDBACKS_ACTION, fetchFeedbacks);
  yield takeLatest(EXPORT_FEEDBACKS_ACTION, exportFeedbacks);
  yield takeLatest(FETCH_FEEDBACK_SITES_ACTION, fetchFeedbackSites);
  yield takeLatest(UPDATE_FEEDBACK_SITE_ACTION, updateFeedbackSite);
  yield takeLatest(DELETE_FEEDBACK_SITE_ACTION, deleteFeedbackSite);
  yield takeLatest(FETCH_FEEDBACK_METRICS_ACTION, fetchFeedbackMetrics);
  yield takeLatest(FETCH_FEEDBACK_METRICS_MONTHLY_CHANGE_ACTION, fetchFeedbackMetricsMoM);
}
