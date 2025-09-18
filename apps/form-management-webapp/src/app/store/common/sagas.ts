import { call, Effect, put, select } from '@redux-saga/core/effects';
import { ErrorNotification } from '@store/notifications/actions';
import { getAccessToken } from '@store/tenant/sagas';
import axios from 'axios';
import moment from 'moment';
import { RootState } from '../index';

interface MetricResponse {
  values: { sum: string; avg: string; max: string }[];
}

export function* fetchServiceMetrics(
  metricLike: string,
  done: (metrics: Record<string, MetricResponse>) => Generator<Effect>,
  interval: 'hourly' | 'daily' | 'weekly' = 'weekly'
) {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const criteria = JSON.stringify({
        intervalMax: moment().toISOString(),
        intervalMin: moment().startOf('week').toISOString(),
        metricLike,
      });

      const { data: metrics }: { data: Record<string, MetricResponse> } = yield call(
        axios.get,
        `${baseUrl}/value/v1/event-service/values/event/metrics`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: {
            interval,
            criteria,
          },
        }
      );

      yield* done(metrics);
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}
