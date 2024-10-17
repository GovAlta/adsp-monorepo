import { call, Effect, put, select } from '@redux-saga/core/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';
import axios from 'axios';
import moment from 'moment';
import { RootState } from '../index';

interface MetricResponse {
  values: { sum: string; avg: string, max: string }[];
}

export function* fetchServiceMetrics(
  metricLike: string,
  done: (metrics: Record<string, MetricResponse>) => Generator<Effect>
) {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().subtract(7, 'day').toISOString(),
        metricLike,
      });

      const { data: metrics }: { data: Record<string, MetricResponse> } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics?interval=weekly&criteria=${criteria}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      yield* done(metrics);
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}
