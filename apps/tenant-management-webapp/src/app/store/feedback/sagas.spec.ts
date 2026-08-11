import { expectSaga } from 'redux-saga-test-plan';
import axios from 'axios';
import { fetchFeedbackMetrics } from './sagas';
import { getAccessToken } from '@store/tenant/sagas';
import { FETCH_FEEDBACK_METRICS_SUCCESS_ACTION } from './actions';

const storeState = {
  config: { serviceUrls: { valueServiceApiUrl: 'http://mock-value-service.com' } },
};

// One registered site, one view — the shape that exposed the defect. Ratings are recorded
// 0-based, so these five entries are the 5, 5, 1, 2, 1 shown in the feedback list.
const singleSiteResponse = {
  'adsp-dev:/admin/services/feedback:count': { values: [{ sum: '5', avg: '1', min: '1' }] },
  'adsp-dev:/admin/services/feedback:rating': { values: [{ sum: '9', avg: '1.8', min: '0' }] },
};

const metricsFrom = (data: Record<string, unknown>) =>
  expectSaga(fetchFeedbackMetrics)
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === getAccessToken) {
          return 'mock-token';
        }
        if (effect.fn === axios.get) {
          return { data };
        }
        return next();
      },
    })
    .run()
    .then(({ effects }) =>
      effects.put
        .map((e) => e.payload.action)
        .find((a) => a.type === FETCH_FEEDBACK_METRICS_SUCCESS_ACTION)?.metrics,
    );

describe('fetchFeedbackMetrics', () => {
  it('reports the lowest rating submitted, not the lowest site average', async () => {
    // Regression guard: Math.min over the site averages returns the overall average whenever a
    // tenant has one site, so this card mirrored the average card instead of showing the worst
    // rating anyone gave.
    const metrics = await metricsFrom(singleSiteResponse);

    expect(metrics.averageRating).toBe(1.8);
    expect(metrics.lowestRating).toBe(0);
    expect(metrics.feedbackCount).toBe(5);
  });

  it('takes the lowest rating across every site', async () => {
    const metrics = await metricsFrom({
      'site-a:/one:count': { values: [{ sum: '4', avg: '1', min: '1' }] },
      'site-a:/one:rating': { values: [{ sum: '12', avg: '3', min: '2' }] },
      'site-b:/two:count': { values: [{ sum: '2', avg: '1', min: '1' }] },
      'site-b:/two:rating': { values: [{ sum: '2', avg: '1', min: '0' }] },
    });

    expect(metrics.lowestRating).toBe(0);
  });

  it('returns null ratings when nothing has been submitted', async () => {
    const metrics = await metricsFrom({});

    expect(metrics.averageRating).toBeNull();
    expect(metrics.lowestRating).toBeNull();
  });
});
