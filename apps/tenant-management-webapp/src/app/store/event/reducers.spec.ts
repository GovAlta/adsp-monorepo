import reducer from './reducers';
import { clearEventLogEntries, getEventLogPage, getEventLogPageSucceeded } from './actions';

const loggedEvent = (correlationId: string) => ({
  context: { namespace: 'form-service', name: 'form-submitted' },
  timestamp: '2026-10-01T15:30:00.000Z',
  correlationId,
  value: { payload: { formId: correlationId } },
});

describe('event reducer: event log pages', () => {
  const firstPageState = reducer(undefined, getEventLogPageSucceeded([loggedEvent('form-a')], 1, 347));

  it('replaces the displayed events with the requested page', () => {
    const state = reducer(firstPageState, getEventLogPageSucceeded([loggedEvent('form-b')], 2));

    expect(state.entries.map(({ correlationId }) => correlationId)).toEqual(['form-b']);
  });

  it('records the page being displayed', () => {
    const state = reducer(firstPageState, getEventLogPageSucceeded([loggedEvent('form-b')], 2));

    expect(state.logPage.page).toBe(2);
  });

  it('keeps the search total when moving between pages', () => {
    const state = reducer(firstPageState, getEventLogPageSucceeded([loggedEvent('form-b')], 2));

    expect(state.logPage.total).toBe(347);
  });

  it('stops loading once the page arrives', () => {
    const loadingState = reducer(firstPageState, getEventLogPage(2, { namespace: 'form-service' }));

    const state = reducer(loadingState, getEventLogPageSucceeded([loggedEvent('form-b')], 2));

    expect(state.isLoading.log).toBe(false);
  });

  it('forgets the page and total when the event log is cleared for a new search', () => {
    const state = reducer(firstPageState, clearEventLogEntries());

    expect(state.logPage).toBeNull();
  });
});
