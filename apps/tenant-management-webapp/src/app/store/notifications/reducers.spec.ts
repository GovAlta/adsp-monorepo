import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { FETCH_CONFIG_SUCCESS_ACTION } from '@store/config/actions';
import { ErrorNotification, SuccessNotification } from './actions';
import { NOTIFICATION_INIT } from './models';
import reducer from './reducers';

const directory = { 'calendar-service': 'https://calendar-service.adsp.alberta.ca' };

function networkError(): AxiosError {
  const config = {
    method: 'get',
    url: 'https://calendar-service.adsp.alberta.ca/calendar/v1/calendars',
    headers: new AxiosHeaders(),
  } as InternalAxiosRequestConfig;
  return new AxiosError('Network Error', 'ERR_NETWORK', config, {});
}

describe('notifications reducer', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-11-20T15:51:14.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the service directory from the loaded config', () => {
    const state = reducer(NOTIFICATION_INIT, { type: FETCH_CONFIG_SUCCESS_ACTION, payload: { directory } });

    expect(state.services).toEqual(directory);
  });

  it('stores a friendly message naming the service, instead of ": Network Error"', () => {
    const configured = reducer(NOTIFICATION_INIT, { type: FETCH_CONFIG_SUCCESS_ACTION, payload: { directory } });

    const state = reducer(configured, ErrorNotification({ error: networkError() }));

    expect(state.notifications[0].message).toMatch(/^We couldn't reach the calendar-service\./);
  });

  it('stores support details with the page and time of the failure', () => {
    window.history.pushState({}, '', '/admin/services/status');

    const state = reducer(NOTIFICATION_INIT, ErrorNotification({ error: networkError() }));

    expect(state.notifications[0].details).toEqual(
      expect.objectContaining({
        request: 'GET https://calendar-service.adsp.alberta.ca/calendar/v1/calendars',
        page: '/admin/services/status',
        time: '2026-11-20T15:51:14.000Z',
      }),
    );
  });

  it('stores a success message as given', () => {
    const state = reducer(NOTIFICATION_INIT, SuccessNotification({ message: 'Calendar saved' }));

    expect(state.notifications[0].message).toBe('Calendar saved');
    expect(state.notifications[0].details).toBeUndefined();
  });
});
