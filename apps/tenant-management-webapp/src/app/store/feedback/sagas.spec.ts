import { expectSaga } from 'redux-saga-test-plan';
import axios from 'axios';
import {
  exportFeedbacks,
  fetchFeedbackMetrics,
  fetchFeedbacks,
  fetchFeedbackSummary,
  normalizeFeedbackDateRange,
} from './sagas';
import { getAccessToken } from '@store/tenant/sagas';
import { UpdateIndicator } from '@store/session/actions';
import { ERROR_NOTIFICATION } from '@store/notifications/actions';
import {
  exportFeedbacks as exportFeedbacksAction,
  FETCH_FEEDBACK_METRICS_SUCCESS_ACTION,
  FETCH_FEEDBACKS_SUCCESS_ACTION,
  FETCH_FEEDBACK_SUMMARY_SUCCESS_ACTION,
  getFeedbacks,
  getFeedbackSummary,
} from './actions';

const storeState = {
  config: { serviceUrls: { valueServiceApiUrl: 'http://mock-value-service.com' } },
};

// One registered site, one view — the shape that exposed the defect. Ratings are recorded
// 0-based, so these five entries are the 5, 5, 1, 2, 1 shown in the feedback list.
const singleSiteResponse = {
  'adsp-dev:/admin/services/feedback:count': { values: [{ sum: '5', avg: '1', min: '1', count: '5' }] },
  'adsp-dev:/admin/services/feedback:rating': { values: [{ sum: '9', avg: '1.8', min: '0', count: '5' }] },
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
    .then(
      ({ effects }) =>
        effects.put.map((e) => e.payload.action).find((a) => a.type === FETCH_FEEDBACK_METRICS_SUCCESS_ACTION)?.metrics,
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
      'site-a:/one:count': { values: [{ sum: '4', avg: '1', min: '1', count: '4' }] },
      'site-a:/one:rating': { values: [{ sum: '12', avg: '3', min: '2', count: '4' }] },
      'site-b:/two:count': { values: [{ sum: '2', avg: '1', min: '1', count: '2' }] },
      'site-b:/two:rating': { values: [{ sum: '2', avg: '1', min: '0', count: '2' }] },
    });

    expect(metrics.lowestRating).toBe(0);
  });

  // The API serves whole intervals only, so a seven-day window comes back as a bucket per day and
  // never as one weekly total. Reading `values[0]` took a single day and called it the week.
  it('folds every daily bucket in the window into one figure', async () => {
    const metrics = await metricsFrom({
      'site-a:/one:count': {
        values: [
          { sum: '3', avg: '1', min: '1', count: '3' },
          { sum: '2', avg: '1', min: '1', count: '2' },
        ],
      },
      'site-a:/one:rating': {
        values: [
          { sum: '12', avg: '4', min: '3', count: '3' },
          { sum: '2', avg: '1', min: '0', count: '2' },
        ],
      },
    });

    expect(metrics.feedbackCount).toBe(5);
    // 14 across 5 submissions, not the 2.5 an average of the two days' averages would give: the
    // busier day has to carry more weight.
    expect(metrics.averageRating).toBe(2.8);
    expect(metrics.lowestRating).toBe(0);
  });

  it('returns null ratings when nothing has been submitted', async () => {
    const metrics = await metricsFrom({});

    expect(metrics.averageRating).toBeNull();
    expect(metrics.lowestRating).toBeNull();
  });
});

describe('fetchFeedbacks', () => {
  const site = { url: 'https://site.example', allowAnonymous: true };
  const searchCriteria = { startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-06-30T00:00:00.000Z' };
  const feedbackUrl = 'http://mock-value-service.com/value/v1/feedback-service/values/feedback';
  const filterParams = {
    context: JSON.stringify({ site: site.url }),
    timestampMin: searchCriteria.startDate,
    // The selected end day is extended so feedback received on that day is included.
    timestampMax: '2025-07-01T01:59:59.999Z',
  };
  const pageResponse = (ratingValues: number[]) => ({
    data: {
      'feedback-service': {
        feedback: ratingValues.map((ratingValue) => ({ value: { rating: 'good', ratingValue } })),
      },
    },
  });
  const axiosGet = jest.fn();
  const providers = {
    call(effect, next) {
      if (effect.fn === getAccessToken) {
        return 'mock-token';
      }
      if (effect.fn === axios.get) {
        return axiosGet(...effect.args);
      }
      return next();
    },
  };
  const run = (action: ReturnType<typeof getFeedbacks>) =>
    expectSaga(fetchFeedbacks, action).withState(storeState).provide(providers).run();

  afterEach(() => {
    axiosGet.mockReset();
  });

  it('reads the first page and the total for a new search', async () => {
    axiosGet.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/count') ? { data: { count: 60 } } : pageResponse([3, 4])),
    );

    const { effects } = await run(getFeedbacks(site, { ...searchCriteria }, 1, 25, true));

    expect(axiosGet).toHaveBeenCalledWith(
      feedbackUrl,
      expect.objectContaining({ params: { ...filterParams, top: 25, after: btoa('0') } }),
    );
    expect(axiosGet).toHaveBeenCalledWith(`${feedbackUrl}/count`, expect.objectContaining({ params: filterParams }));
    const success = effects.put.map((e) => e.payload.action).find((a) => a.type === FETCH_FEEDBACKS_SUCCESS_ACTION);
    expect(success).toMatchObject({ page: 1, pageSize: 25, total: 60 });
    // Ratings are stored 0-based and shown 1-based.
    expect(success.payload.map((f) => f.value.ratingValue)).toEqual([4, 5]);
  });

  it('reads an intermediate page from its row offset without recounting', async () => {
    axiosGet.mockResolvedValue(pageResponse([2]));

    const { effects } = await run(getFeedbacks(site, { ...searchCriteria }, 2, 25));

    expect(axiosGet).toHaveBeenCalledTimes(1);
    expect(axiosGet).toHaveBeenCalledWith(
      feedbackUrl,
      expect.objectContaining({ params: { ...filterParams, top: 25, after: btoa('25') } }),
    );
    const success = effects.put.map((e) => e.payload.action).find((a) => a.type === FETCH_FEEDBACKS_SUCCESS_ACTION);
    expect(success).toMatchObject({ page: 2, pageSize: 25, total: undefined });
  });

  it('reads the last page from its row offset at the selected page size', async () => {
    axiosGet.mockResolvedValue(pageResponse([1]));

    await run(getFeedbacks(site, { ...searchCriteria }, 6, 10));

    expect(axiosGet).toHaveBeenCalledWith(
      feedbackUrl,
      expect.objectContaining({ params: { ...filterParams, top: 10, after: btoa('50') } }),
    );
  });

  it('reports an empty page and a total of zero when nothing matches', async () => {
    axiosGet.mockImplementation((url: string) =>
      Promise.resolve(url.endsWith('/count') ? { data: { count: 0 } } : pageResponse([])),
    );

    const { effects } = await run(getFeedbacks(site, { ...searchCriteria }, 1, 25, true));

    const success = effects.put.map((e) => e.payload.action).find((a) => a.type === FETCH_FEEDBACKS_SUCCESS_ACTION);
    expect(success).toMatchObject({ payload: [], page: 1, total: 0 });
  });

  it('does not move the selected end date on each page request', async () => {
    axiosGet.mockResolvedValue(pageResponse([1]));
    const criteria = { ...searchCriteria };

    await run(getFeedbacks(site, criteria, 2, 25));
    await run(getFeedbacks(site, criteria, 3, 25));

    expect(criteria.endDate).toBe(searchCriteria.endDate);
    expect(axiosGet.mock.calls.map(([, config]) => config.params.timestampMax)).toEqual([
      filterParams.timestampMax,
      filterParams.timestampMax,
    ]);
  });

  it('notifies of the failure and clears the loading indicator when a page cannot be read', async () => {
    axiosGet.mockRejectedValue(new Error('request failed'));

    const { effects } = await run(getFeedbacks(site, { ...searchCriteria }, 2, 25));

    const actions = effects.put.map((e) => e.payload.action);
    expect(actions.find((a) => a.type === FETCH_FEEDBACKS_SUCCESS_ACTION)).toBeUndefined();
    expect(actions).toContainEqual(expect.objectContaining({ type: ERROR_NOTIFICATION }));
    expect(actions[actions.length - 1]).toEqual(UpdateIndicator({ show: false }));
  });
});

describe('fetchFeedbackSummary', () => {
  it('requests the summary for the selected site and normalized date range', async () => {
    const action = getFeedbackSummary('https://service.alberta.ca', {
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T00:00:00.000Z',
    });
    const summary = {
      totalResponses: 247,
      averageRating: 3.8,
      responsesWithComments: 38,
      responsesWithIssues: 21,
    };

    await expectSaga(fetchFeedbackSummary, action)
      .withState({ config: { serviceUrls: { feedbackServiceUrl: 'https://feedback-service.example' } } })
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'mock-token';
          }
          if (effect.fn === axios.get) {
            expect(effect.args[0]).toContain('/feedback/v1/feedback/summary?');
            expect(effect.args[0]).toContain('site=https%3A%2F%2Fservice.alberta.ca');
            expect(effect.args[0]).toContain('end=2026-10-31T23%3A59%3A59.999Z');
            return { data: summary };
          }
          return next();
        },
      })
      .put({ type: FETCH_FEEDBACK_SUMMARY_SUCCESS_ACTION, summary })
      .run();
  });

  it('normalizes the end date to the end of the selected UTC day', () => {
    const range = normalizeFeedbackDateRange({
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2026-10-31T00:00:00.000Z',
    });

    expect(range).toEqual({
      start: '2026-10-01T00:00:00.000Z',
      end: '2026-10-31T23:59:59.999Z',
    });
  });
});

describe('exportFeedbacks', () => {
  it('exports up to the end of the selected end day, matching the listed feedback', async () => {
    const axiosGet = jest.fn().mockResolvedValue({ data: { 'feedback-service': { feedback: [] }, page: {} } });

    await expectSaga(
      exportFeedbacks,
      exportFeedbacksAction(
        { site: 'https://site.example' },
        { startDate: '2025-01-01T00:00:00.000Z', endDate: '2025-06-30T00:00:00.000Z' },
      ),
    )
      .withState(storeState)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'mock-token';
          }
          if (effect.fn === axios.get) {
            return axiosGet(...effect.args);
          }
          return next();
        },
      })
      .run();

    expect(axiosGet.mock.calls[0][0]).toContain('&timestampMax=2025-07-01T01:59:59.999Z');
  });
});
