import React from 'react';
import axios from 'axios';
import { Provider } from 'react-redux';
import { runSaga } from 'redux-saga';
import configureStore from 'redux-mock-store';
import { fireEvent, render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FETCH_EVENT_LOG_PAGE_ACTION } from '@store/event/actions';
import { fetchEventLogPage } from '@store/event/sagas';
import { EventLog } from './eventLog';

jest.mock('@lib/dynamicPlaceHolder', () => ({ dynamicGeneratePayload: jest.fn() }));
jest.mock('./eventLogEntries', () => ({ EventLogEntries: () => null }));
jest.mock('@store/tenant/sagas', () => ({ getAccessToken: jest.fn(() => 'test-token') }));

const createStore = () =>
  configureStore([])({
    event: {
      entries: [],
      logPage: { page: 1, pageSize: 10, total: 347 },
      isLoading: { log: false, definitions: false },
      definitions: {
        'form-service:form-created': { namespace: 'form-service', name: 'form-created' },
      },
    },
    config: {
      serviceUrls: {
        valueServiceApiUrl: 'https://value-service.example',
        eventServiceApiUrl: 'https://event-service.example',
      },
    },
    session: {
      resourceAccess: { 'urn:ads:platform:value-service': { roles: ['value-reader'] } },
    },
  });

const renderPage = () => {
  const store = createStore();
  const result = render(
    <Provider store={store}>
      <EventLog />
    </Provider>,
  );
  return { ...result, store };
};

const clickButton = (container: HTMLElement, testId: string) =>
  fireEvent(container.querySelector(`goa-button[testid="${testId}"]`), new CustomEvent('_click'));

const changeDropdown = (container: HTMLElement, name: string, value: string) =>
  fireEvent(container.querySelector(`goa-dropdown[name="${name}"]`), new CustomEvent('_change', { detail: { value } }));

const requestLatestSearch = async (store: ReturnType<typeof createStore>) => {
  const action = store
    .getActions()
    .filter(({ type }) => type === FETCH_EVENT_LOG_PAGE_ACTION)
    .pop();
  await runSaga({ getState: store.getState, dispatch: store.dispatch }, fetchEventLogPage, action).toPromise();
  const [, config] = jest
    .mocked(axios.get)
    .mock.calls.filter(([url]) => url.includes('/value/v1/'))
    .slice(-1)[0];
  return new URLSearchParams(config.params);
};

describe('Event log applied date filters', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-10-19T18:30:45.123Z'));
    jest.spyOn(axios, 'get').mockResolvedValue({ data: { 'event-service': { event: [] }, page: {}, count: 347 } });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
  });

  it('sends exactly one initial search with the displayed Last 7 days boundaries', async () => {
    const { container, store } = renderPage();

    const params = await requestLatestSearch(store);

    expect(store.getActions().filter(({ type }) => type === FETCH_EVENT_LOG_PAGE_ACTION)).toHaveLength(1);
    expect(params.get('timestampMin')).toBe('2026-10-12T18:30:45.123Z');
    expect(params.get('timestampMax')).toBe('2026-10-19T18:30:45.123Z');
    expect(axios.get).toHaveBeenCalledWith(
      'https://event-service.example/event/v1/events/count',
      expect.objectContaining({
        params: {
          timestampMin: '2026-10-12T18:30:45.123Z',
          timestampMax: '2026-10-19T18:30:45.123Z',
        },
      }),
    );
    expect(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]')).toHaveAttribute(
      'value',
      'last-7-days',
    );
    expect(container.querySelector('goa-filter-chip[testid="event-log-filter-badge-dateRange"]')).toHaveAttribute(
      'content',
      'Date range: Last 7 days',
    );
  });

  it('updates the query and applied chip when a different period is searched', async () => {
    const { container, store } = renderPage();
    changeDropdown(container, 'event-log-date-range-filter', 'last-hour');
    jest.setSystemTime(new Date('2026-10-19T19:00:00.000Z'));

    clickButton(container, 'event-log-filter-search');
    const params = await requestLatestSearch(store);

    expect(params.get('timestampMin')).toBe('2026-10-19T18:00:00.000Z');
    expect(params.get('timestampMax')).toBe('2026-10-19T19:00:00.000Z');
    expect(container.querySelector('goa-filter-chip')).toHaveAttribute('content', 'Date range: Last hour');
  });

  it('clears the selected period while pinning the pagination cutoff when the date chip is removed', async () => {
    const { container, store } = renderPage();
    const chip = container.querySelector('goa-filter-chip[testid="event-log-filter-badge-dateRange"]');

    fireEvent(chip, new CustomEvent('_click'));
    const params = await requestLatestSearch(store);

    expect(params.has('timestampMin')).toBe(false);
    expect(params.get('timestampMax')).toBe('2026-10-19T18:30:45.123Z');
    expect(container.querySelector('goa-filter-chip')).not.toBeInTheDocument();
    expect(container.querySelector('goa-dropdown[name="event-log-date-range-filter"]')).toHaveAttribute('value', '');
  });

  it('resets to a fresh Last 7 days request and clears other filters', async () => {
    const { container, store } = renderPage();
    changeDropdown(container, 'event-log-namespace-filter', 'form-service');
    clickButton(container, 'event-log-filter-search');
    jest.setSystemTime(new Date('2026-10-20T20:00:00.000Z'));

    clickButton(container, 'event-log-filter-reset');
    const params = await requestLatestSearch(store);

    expect(params.get('timestampMin')).toBe('2026-10-13T20:00:00.000Z');
    expect(params.get('timestampMax')).toBe('2026-10-20T20:00:00.000Z');
    expect(params.has('context')).toBe(false);
    expect(container.querySelectorAll('goa-filter-chip')).toHaveLength(1);
    expect(container.querySelector('goa-filter-chip')).toHaveAttribute('content', 'Date range: Last 7 days');
  });

  it('keeps the cutoff across pages after the user clears the selected period', async () => {
    const { container, store, getByTestId } = renderPage();
    fireEvent(
      container.querySelector('goa-filter-chip[testid="event-log-filter-badge-dateRange"]'),
      new CustomEvent('_click'),
    );
    jest.setSystemTime(new Date('2026-10-20T20:00:00.000Z'));

    fireEvent.change(getByTestId('event-log-pagination-page'), { target: { value: '2' } });
    const params = await requestLatestSearch(store);

    expect(params.has('timestampMin')).toBe(false);
    expect(params.get('timestampMax')).toBe('2026-10-19T18:30:45.123Z');
    expect(container.querySelector('goa-filter-chip')).not.toBeInTheDocument();
  });

  it('keeps applied boundaries and other filters when loading the next page', async () => {
    const { container, store, getByTestId } = renderPage();
    changeDropdown(container, 'event-log-namespace-filter', 'form-service');
    changeDropdown(container, 'event-log-name-filter', 'form-created');
    fireEvent(
      container.querySelector('goa-input[name="event-log-correlation-filter"]'),
      new CustomEvent('_change', { detail: { value: 'corr-form-submission' } }),
    );
    clickButton(container, 'event-log-filter-search');
    jest.setSystemTime(new Date('2026-10-20T20:00:00.000Z'));

    fireEvent.change(getByTestId('event-log-pagination-page'), { target: { value: '2' } });
    const params = await requestLatestSearch(store);

    expect(params.get('after')).toBe(btoa('10'));
    expect(params.get('order')).toBe('desc');
    expect(params.get('timestampMin')).toBe('2026-10-12T18:30:45.123Z');
    expect(params.get('timestampMax')).toBe('2026-10-19T18:30:45.123Z');
    expect(JSON.parse(params.get('context'))).toEqual({ namespace: 'form-service', name: 'form-created' });
    expect(params.get('correlationId')).toBe('corr-form-submission');
  });
});
