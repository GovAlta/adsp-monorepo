import { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { describeError, formatSupportDetails } from './errors';

const services = {
  'calendar-service': 'https://calendar-service.adsp.alberta.ca',
  'configuration-service': 'https://configuration-service.adsp.alberta.ca',
};

const calendarUrl = 'https://calendar-service.adsp.alberta.ca/calendar/v1/calendars/form-intake/events?criteria=x';

function httpError(status: number | undefined, data?: unknown, code = 'ERR_BAD_RESPONSE', url = calendarUrl): AxiosError {
  const config = { method: 'get', url, headers: new AxiosHeaders() } as InternalAxiosRequestConfig;
  const response =
    status === undefined
      ? undefined
      : { status, statusText: '', data, headers: {}, config };
  const message = status === undefined ? 'Network Error' : `Request failed with status code ${status}`;
  return new AxiosError(message, code, config, {}, response);
}

describe('describeError', () => {
  describe('when the request got no response', () => {
    it('names the service it could not reach and tells the user what to do', () => {
      const { message } = describeError(undefined, httpError(undefined, undefined, 'ERR_NETWORK'), services);

      expect(message).toBe(
        "We couldn't reach the calendar-service. Try again in a minute. If it keeps happening, contact support and include the details below.",
      );
    });

    it('keeps the caller message as the first sentence', () => {
      const { message } = describeError(
        'failed to load intake periods',
        httpError(undefined, undefined, 'ERR_NETWORK'),
        services,
      );

      expect(message).toMatch(/^Failed to load intake periods\. We couldn't reach the calendar-service\./);
    });

    it('records the request without its query string, and the network error', () => {
      const { details } = describeError(undefined, httpError(undefined, undefined, 'ERR_NETWORK'), services);

      expect(details).toEqual({
        service: 'calendar-service',
        request: 'GET https://calendar-service.adsp.alberta.ca/calendar/v1/calendars/form-intake/events',
        result: 'No response: Network Error (ERR_NETWORK)',
      });
    });

    it('says the service took too long when the request timed out', () => {
      const { message } = describeError(undefined, httpError(undefined, undefined, 'ECONNABORTED'), services);

      expect(message).toMatch(/^The calendar-service took too long to respond\./);
    });

    it('tells the user they are offline when the browser is offline', () => {
      jest.spyOn(window.navigator, 'onLine', 'get').mockReturnValue(false);

      const { message } = describeError(undefined, httpError(undefined, undefined, 'ERR_NETWORK'), services);

      expect(message).toBe('You appear to be offline. Check your connection and try again.');
      jest.restoreAllMocks();
    });

    it('falls back to the host name for a service not in the directory', () => {
      const error = httpError(undefined, undefined, 'ERR_NETWORK', 'https://unknown.example.com/api');

      const { message, details } = describeError(undefined, error, services);

      expect(message).toMatch(/^We couldn't reach the unknown\.example\.com\./);
      expect(details.service).toBe('unknown.example.com');
    });
  });

  describe('when the service responded with an error status', () => {
    it('asks the user to sign in again for 401', () => {
      const { message } = describeError(undefined, httpError(401), services);

      expect(message).toBe('Your session has expired. Sign in again to continue.');
    });

    it('names the blocked action for 403', () => {
      const error = httpError(403, {
        errorMessage: 'User Jane (ID: 123) not permitted to manage calendar definitions.',
      });

      const { message } = describeError('Failed to save calendar', error, services);

      expect(message).toBe(
        "Failed to save calendar. You don't have permission to manage calendar definitions. Ask your tenant administrator for access.",
      );
    });

    it('uses a general permission message for 403 without a server message', () => {
      const { message } = describeError(undefined, httpError(403), services);

      expect(message).toBe("You don't have permission to do this. Ask your tenant administrator for access.");
    });

    it('shows the server message for 400 so the user can correct their input', () => {
      const error = httpError(400, { errorMessage: 'Calendar name must be unique' });

      const { message } = describeError('Failed to save calendar', error, services);

      expect(message).toBe('Failed to save calendar. Calendar name must be unique.');
    });

    it('shows a server error field when there is no errorMessage', () => {
      const { message } = describeError(undefined, httpError(409, { error: 'Already exists.' }), services);

      expect(message).toBe('Already exists.');
    });

    it('does not show an HTML error page returned by the server', () => {
      const error = httpError(404, '<pre>Cannot GET /calendar/v1/unknown</pre>');

      const { message } = describeError(undefined, error, services);

      expect(message).toBe(
        "We couldn't find what you asked for. It may have been deleted. Refresh the page and try again.",
      );
    });

    it('asks the user to wait for 429', () => {
      const { message } = describeError(undefined, httpError(429), services);

      expect(message).toBe('Too many requests. Wait a moment, then try again.');
    });

    it('says the service is temporarily unavailable for 504', () => {
      const { message, details } = describeError(undefined, httpError(504, 'Gateway Timeout'), services);

      expect(message).toMatch(/^The calendar-service is temporarily unavailable\. Try again in a minute\./);
      expect(details.result).toBe('HTTP 504');
    });

    it('never shows the response body for 500', () => {
      const error = httpError(500, { errorMessage: 'MongoServerError: connection refused' });

      const { message } = describeError(undefined, error, services);

      expect(message).toBe(
        'Something went wrong in the calendar-service. Try again in a minute. If it keeps happening, contact support and include the details below.',
      );
    });
  });

  describe('when the error is not from a request', () => {
    it('shows the message of an error the app raised on purpose', () => {
      const { message, details } = describeError(undefined, new Error('Calendar display name is required.'), services);

      expect(message).toBe('Calendar display name is required.');
      expect(details).toBeUndefined();
    });

    it('hides a programming error behind a general message and keeps it for support', () => {
      const { message, details } = describeError(undefined, new TypeError("Cannot read properties of undefined (reading 'id')"), services);

      expect(message).toBe(
        'Something went wrong in the admin app. Refresh the page and try again. If it keeps happening, contact support and include the details below.',
      );
      expect(details).toEqual({ error: "TypeError: Cannot read properties of undefined (reading 'id')" });
    });

    it('shows a string error as a sentence', () => {
      const { message } = describeError(undefined, 'calendar not found', services);

      expect(message).toBe('Calendar not found.');
    });

    it('treats a non-string message as the error', () => {
      const { message, details } = describeError({ reason: 'socket closed' }, undefined, services);

      expect(message).toMatch(/^Something went wrong in the admin app\./);
      expect(details).toEqual({ error: '{"reason":"socket closed"}' });
    });
  });

  it('returns the caller message unchanged in meaning when there is no error', () => {
    const { message, details } = describeError('Failed to fetch cache targets', undefined, services);

    expect(message).toBe('Failed to fetch cache targets.');
    expect(details).toBeUndefined();
  });

  it('returns a general message when there is neither a message nor an error', () => {
    const { message } = describeError(undefined, undefined, services);

    expect(message).toBe('Something went wrong.');
  });
});

describe('formatSupportDetails', () => {
  it('lists the known details one per line in a fixed order', () => {
    const text = formatSupportDetails({
      time: '2026-11-20T15:51:14.000Z',
      page: '/admin/services/status',
      result: 'HTTP 504',
      request: 'GET https://calendar-service.adsp.alberta.ca/calendar/v1/calendars',
      service: 'calendar-service',
      tenant: 'Autotest',
    });

    expect(text).toBe(
      [
        'Service: calendar-service',
        'Request: GET https://calendar-service.adsp.alberta.ca/calendar/v1/calendars',
        'Result: HTTP 504',
        'Page: /admin/services/status',
        'Tenant: Autotest',
        'Time: 2026-11-20T15:51:14.000Z',
      ].join('\n'),
    );
  });

  it('leaves out details that are not known', () => {
    expect(formatSupportDetails({ error: 'TypeError: x', time: '2026-11-20T15:51:14.000Z' })).toBe(
      'Error: TypeError: x\nTime: 2026-11-20T15:51:14.000Z',
    );
  });
});
