import { SagaIterator } from '@redux-saga/core';
import axios from 'axios';
import moment, { Moment } from 'moment';
import { select, call, put, takeLatest } from 'redux-saga/effects';
import {
  FetchServiceMetricsAction,
  fetchServiceMetricsSuccess,
  fetchServicesSuccess,
  FETCH_SERVICES_ACTION,
  FETCH_SERVICE_METRICS_ACTION,
  fetchDashboardMetricsSuccess,
  FETCH_DASHBOARD_METRICS_ACTION,
  FetchDashboardMetricsAction,
} from './actions';
import { RootState } from '../index';
import { ErrorNotification } from '../notifications/actions';
import { ChartInterval, ValueMetric, ValueMetricFields } from './models';
import { getAccessToken } from '@store/tenant/sagas';

function* fetchServices() {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.configurationServiceApiUrl);
  const token: string = yield call(getAccessToken);

  if (baseUrl && token) {
    try {
      const { data }: { data: Record<string, { definitions: Record<string, unknown> }> } = yield call(
        axios.get,
        `${baseUrl}/configuration/v2/configuration/platform/value-service/latest?core`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const { data: tenantData }: { data: Record<string, { definitions: Record<string, unknown> }> } = yield call(
        axios.get,
        `${baseUrl}/configuration/v2/configuration/platform/value-service/latest`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const services = [...Object.entries(tenantData), ...Object.entries(data)]
        .filter(([_service, { definitions }]) => definitions['service-metrics'])
        .map(([service]) => service);

      yield put(fetchServicesSuccess(services));
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

const intervalDelta: Record<ChartInterval, number> = {
  '15 mins': 0.25,
  '1 hour': 1,
  '5 hours': 5,
};

function* generateSampleIntervals(
  intervalMin: Moment,
  intervalMax: Moment,
  interval: ChartInterval
): Generator<Moment> {
  const intervalMinutes = interval === '15 mins' ? 1 : 5;
  let value: Moment = intervalMax
    .clone()
    .subtract(intervalMax.minutes() % intervalMinutes, 'minutes')
    .seconds(0)
    .milliseconds(0);
  while (value > intervalMin) {
    yield value;
    value = value.clone().subtract(intervalMinutes, 'minutes');
  }
}

function mapMetricValuesToSamples(
  metric: ValueMetric,
  samples: Moment[],
  getValue = (fields: Omit<ValueMetricFields, 'interval'>) => parseFloat(fields.avg)
) {
  const values: Record<string, { interval: Moment; value: number }> =
    metric?.values?.reduce(
      (sampleValues, { interval, ...fields }) => ({
        ...sampleValues,
        [interval]: { interval: moment(interval), value: getValue(fields) },
      }),
      {}
    ) || {};

  return samples.map((sample) => values[sample.toISOString()] || { interval: sample, value: NaN });
}

function* fetchServiceMetrics(action: FetchServiceMetricsAction): SagaIterator {
  const baseUrl = yield select((state: RootState) => state.config.serviceUrls?.valueServiceApiUrl);
  const token: string = yield call(getAccessToken);

  const now = moment();
  const chartInterval = action.chartInterval;
  const intervalMax = now.add(5 - (now.minutes() % 5), 'minutes');
  const intervalMin = intervalMax.clone().subtract(intervalDelta[chartInterval], 'hours');
  const samples = Array.from(generateSampleIntervals(intervalMin, intervalMax, chartInterval));

  const metricsUrl = `${baseUrl}/value/v1/${action.service}/values/service-metrics/metrics?top=500&interval=${
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
          mapMetricValuesToSamples(data['total:response-time'], samples),
          Object.values(data || {}).reduce((times, metric) => {
            const { name } = metric;
            if (name !== 'total:response-time' && name?.startsWith('total:') && name.endsWith('-time')) {
              times[name.substring(6)] = mapMetricValuesToSamples(metric, samples);
            }
            return times;
          }, {}),
          mapMetricValuesToSamples(data['total:count'], samples, ({ sum }) => parseInt(sum))
        )
      );
    } catch (err) {
      yield put(ErrorNotification({ error: err }));
    }
  }
}

function* fetchDashboardMetrics(action: FetchDashboardMetricsAction): SagaIterator {
  const { interval } = action;

  try {
    const { data } = yield call(axios.get, `/api/metrics/v1/metrics/${interval.toISO()}`);
    yield put(fetchDashboardMetricsSuccess(data));
  } catch (err) {
    // This is best effort; fine if it fails.
  }
}

export function* watchServiceMetricsSagas(): Generator {
  yield takeLatest(FETCH_DASHBOARD_METRICS_ACTION, fetchDashboardMetrics);
  yield takeLatest(FETCH_SERVICES_ACTION, fetchServices);
  yield takeLatest(FETCH_SERVICE_METRICS_ACTION, fetchServiceMetrics);
}
