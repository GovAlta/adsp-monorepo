import { SagaIterator } from '@redux-saga/core';
import axios from 'axios';
import moment from 'moment';
import { select, call, put, takeLatest } from 'redux-saga/effects';
import {
  FetchServiceMetricsAction,
  fetchServiceMetricsSuccess,
  fetchServicesSuccess,
  FETCH_SERVICES_ACTION,
  FETCH_SERVICE_METRICS_ACTION,
} from './actions';
import { RootState } from '../index';
import { ErrorNotification } from '../notifications/actions';
import { ChartInterval, ValueMetric } from './models';

function* fetchServices() {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  if (baseUrl && token) {
    try {
      const { data }: { data: Record<string, { definitions: Record<string, unknown> }> } = yield call(
        axios.get,
        `${baseUrl}/configuration/v2/configuration/platform/value-service/latest?core`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const services = Object.entries(data)
        .filter(([_service, { definitions }]) => definitions['service-metrics'])
        .map(([service]) => service);

      yield put(fetchServicesSuccess(services));
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

const intervalDelta: Record<ChartInterval, number> = {
  '15 mins': 0.25,
  '1 hour': 1,
  '5 hours': 5,
};

function* fetchServiceMetrics(action: FetchServiceMetricsAction): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield select((state: RootState) => state.session.credentials?.token);

  const now = moment();
  const chartInterval = action.chartInterval;
  const intervalMax = now.add(5 - (now.minutes() % 5), 'minutes');
  const intervalMin = intervalMax.clone().subtract(intervalDelta[chartInterval], 'hours');

  const metricsUrl = `${baseUrl}/value/v1/${action.service}/values/service-metrics/metrics?interval=${
    chartInterval === '15 mins' ? 'one_minute' : 'five_minutes'
  }&criteria=${JSON.stringify({
    metricLike: 'total',
    intervalMin: intervalMin.toDate(),
    intervalMax: intervalMax.toDate(),
  })}`;

  if (baseUrl && token) {
    try {
      const { data }: { data: Record<string, ValueMetric> } = yield call(axios.get, metricsUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      yield put(
        fetchServiceMetricsSuccess(
          intervalMin.toDate(),
          intervalMax.toDate(),
          data['total:response-time']?.values?.map(({ interval, avg }) => ({ interval, value: parseFloat(avg) })) || [],
          data['total:count']?.values?.map(({ interval, sum }) => ({ interval, value: parseInt(sum) })) || []
        )
      );
    } catch (err) {
      yield put(ErrorNotification({ message: err.message }));
    }
  }
}

export function* watchServiceMetricsSagas(): Generator {
  yield takeLatest(FETCH_SERVICES_ACTION, fetchServices);
  yield takeLatest(FETCH_SERVICE_METRICS_ACTION, fetchServiceMetrics);
}
