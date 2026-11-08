import reducer, { initialState } from './reducers';
import { getFeedbacksSuccess, getFeedbackSummary, getFeedbackSummarySuccess } from './actions';
import { Feedback } from './models';

const feedbackAt = (timestamp: string) => ({ timestamp, correlationId: timestamp }) as unknown as Feedback;

describe('feedback reducer', () => {
  it('replaces the shown feedback with the loaded page instead of appending it', () => {
    const firstPage = reducer(initialState, getFeedbacksSuccess([feedbackAt('a'), feedbackAt('b')], 1, 2, 3));

    const secondPage = reducer(firstPage, getFeedbacksSuccess([feedbackAt('c')], 2, 2));

    expect(secondPage.feedbacks).toEqual([feedbackAt('c')]);
  });

  it('records the page, page size and total of a new search', () => {
    const state = reducer(initialState, getFeedbacksSuccess([feedbackAt('a')], 1, 25, 60));

    expect(state.page).toEqual({ page: 1, pageSize: 25, total: 60 });
  });

  it('keeps the total when paging within the same search', () => {
    const firstPage = reducer(initialState, getFeedbacksSuccess([feedbackAt('a')], 1, 25, 60));

    const lastPage = reducer(firstPage, getFeedbacksSuccess([feedbackAt('z')], 3, 25));

    expect(lastPage.page).toEqual({ page: 3, pageSize: 25, total: 60 });
  });

  it('records an empty result with a total of zero', () => {
    const state = reducer(initialState, getFeedbacksSuccess([], 1, 25, 0));

    expect(state.feedbacks).toEqual([]);
    expect(state.page).toEqual({ page: 1, pageSize: 25, total: 0 });
  });

  it('stores a fetched summary', () => {
    const summary = {
      totalResponses: 247,
      averageRating: 3.8,
      responsesWithComments: 38,
      responsesWithIssues: 21,
    };

    const state = reducer(initialState, getFeedbackSummarySuccess(summary));

    expect(state.summary).toEqual(summary);
  });

  it('clears the previous summary when a new request starts', () => {
    const summary = {
      totalResponses: 247,
      averageRating: 3.8,
      responsesWithComments: 38,
      responsesWithIssues: 21,
    };

    const state = reducer(
      { ...initialState, summary },
      getFeedbackSummary('https://service.alberta.ca', {
        startDate: '2026-10-01T00:00:00.000Z',
        endDate: '2026-10-31T00:00:00.000Z',
      }),
    );

    expect(state.summary).toBeNull();
  });
});
