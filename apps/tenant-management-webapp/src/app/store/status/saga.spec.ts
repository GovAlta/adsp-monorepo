import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import { FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION, FETCH_STATUS_METRICS_SUCCESS_ACTION } from './actions';
import { fetchStatusMetrics } from './sagas';

const storeState = {
  config: {
    serviceUrls: {
      valueServiceApiUrl: 'http://mock-directory-host.com',
    },
  },
  session: {
    credentials: {
      tokenExp: Date.now() / 1000 + 1000,
      token: 'mock-token',
    },
  },
  serviceStatus: {
    applications: [
      {
        appKey: 'mock-test#2  ',
        name: 'mock-test',
      },
    ],
  },
};
it('Can run fetch metrics', () => {
  const applications = {};
  const mockMetrics = {
    'status-service:application-healthy:count': {
      name: 'status-service:application-healthy',
      values: [
        {
          avg: '1.00000000000000000000',
          count: '1',
          interval: '2023-01-02T00:00:00.000Z',
          max: '1',
          min: '1',
          sum: '1',
        },
      ],
    },
  };
  const mockParsedMetrics = {
    unhealthyCount: 0,
    maxUnhealthyDuration: 0,
    totalUnhealthyDuration: 0,
    leastHealthyApp: null,
  };

  return expectSaga(fetchStatusMetrics)
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === axios.get) {
          return { data: mockMetrics };
        }
        return next();
      },
    })
    .put({
      type: FETCH_STATUS_METRICS_SUCCESS_ACTION,
      metrics: mockParsedMetrics,
    })
    .dispatch({ type: FETCH_SERVICE_STATUS_APPS_SUCCESS_ACTION, payload: applications })
    .run();
});
