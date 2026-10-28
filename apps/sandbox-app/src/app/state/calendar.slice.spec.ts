import axios from 'axios';
import { getAccessToken } from './user.slice';
import {
  CALENDAR_SERVICE_ID,
  CalendarDefinition,
  calendarReducer,
  calendarsBusySelector,
  calendarsSelector,
  loadCalendars,
} from './calendar.slice';
import { AppState } from './store';

jest.mock('axios');
jest.mock('./user.slice', () => ({ getAccessToken: jest.fn() }));

const axiosMock = axios as jest.Mocked<typeof axios>;
const getAccessTokenMock = getAccessToken as jest.Mock;

const CALENDAR_SERVICE_URL = 'https://calendar-service.adsp-uat.alberta.ca';

const holidays: CalendarDefinition = {
  urn: 'urn:ads:platform:calendar-service:v1:/calendars/stat-holidays',
  name: 'stat-holidays',
  displayName: 'Statutory holidays',
  source: 'core',
};
const sprints: CalendarDefinition = {
  urn: 'urn:ads:platform:calendar-service:v1:/calendars/adsp-sprints',
  name: 'adsp-sprints',
  displayName: 'ADSP sprints',
  description: 'Two-week sprint schedule',
  source: 'tenant',
};

const initialState = calendarReducer(undefined, { type: '@@INIT' });

const appState = (calendar = initialState) =>
  ({ config: { directory: { [CALENDAR_SERVICE_ID]: CALENDAR_SERVICE_URL } }, calendar }) as unknown as AppState;

const runThunk = async (thunk, state = appState()) => {
  const dispatch = jest.fn();
  const action = await thunk(dispatch, () => state, undefined);
  return action;
};

const axiosError = (status: number, data: unknown) => {
  axiosMock.isAxiosError.mockReturnValue(true);
  return Object.assign(new Error(`Request failed with status code ${status}`), {
    isAxiosError: true,
    response: { status, data },
  });
};

describe('calendar slice', () => {
  beforeEach(() => {
    getAccessTokenMock.mockResolvedValue('user-token');
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('calendarReducer', () => {
    test('starts with no calendars', () => {
      // Assert
      expect(initialState.calendars).toEqual([]);
    });

    test('starts with loading false', () => {
      // Assert
      expect(initialState.busy.loading).toBe(false);
    });

    test('sets loading while calendars are being loaded', () => {
      // Act
      const state = calendarReducer(initialState, loadCalendars.pending('request-1', {}));

      // Assert
      expect(state.busy.loading).toBe(true);
    });

    test('stores the loaded calendars when loading succeeds', () => {
      // Arrange
      const loading = { ...initialState, busy: { loading: true } };

      // Act
      const state = calendarReducer(loading, loadCalendars.fulfilled([holidays, sprints], 'request-1', {}));

      // Assert
      expect(state.calendars).toEqual([holidays, sprints]);
    });

    test('clears loading when loading succeeds', () => {
      // Arrange
      const loading = { ...initialState, busy: { loading: true } };

      // Act
      const state = calendarReducer(loading, loadCalendars.fulfilled([holidays], 'request-1', {}));

      // Assert
      expect(state.busy.loading).toBe(false);
    });

    test('clears loading when loading fails', () => {
      // Arrange
      const loading = { ...initialState, busy: { loading: true } };

      // Act
      const state = calendarReducer(loading, loadCalendars.rejected(null, 'request-1', {}));

      // Assert
      expect(state.busy.loading).toBe(false);
    });

    test('keeps previously loaded calendars when loading fails', () => {
      // Arrange
      const loaded = { calendars: [holidays], busy: { loading: true } };

      // Act
      const state = calendarReducer(loaded, loadCalendars.rejected(null, 'request-1', {}));

      // Assert
      expect(state.calendars).toEqual([holidays]);
    });
  });

  describe('loadCalendars', () => {
    test('requests the calendars from the calendar service', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: [holidays] });

      // Act
      await runThunk(loadCalendars({}));

      // Assert
      expect(axiosMock.get).toHaveBeenCalledWith(`${CALENDAR_SERVICE_URL}/calendar/v1/calendars`, expect.anything());
    });

    test('returns the calendars from the response', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: [holidays, sprints] });

      // Act
      const action = await runThunk(loadCalendars({}));

      // Assert
      expect(action.payload).toEqual([holidays, sprints]);
    });

    test('sends the access token as a bearer token', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: [] });

      // Act
      await runThunk(loadCalendars({}));

      // Assert
      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ headers: { Authorization: 'Bearer user-token' } }),
      );
    });

    test('omits the authorization header when no access token is available', async () => {
      // Arrange
      getAccessTokenMock.mockRejectedValue(new Error('Not signed in'));
      axiosMock.get.mockResolvedValue({ data: [] });

      // Act
      await runThunk(loadCalendars({}));

      // Assert
      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ headers: undefined }));
    });

    test('passes the tenant name as the tenant query parameter', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: [] });

      // Act
      await runThunk(loadCalendars({ tenantName: 'autotest' }));

      // Assert
      expect(axiosMock.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ params: { tenant: 'autotest' } }),
      );
    });

    test('omits the query parameters when no tenant name is given', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: [] });

      // Act
      await runThunk(loadCalendars({}));

      // Assert
      expect(axiosMock.get).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ params: undefined }));
    });

    test('loads calendars when the arguments are undefined', async () => {
      // Arrange
      axiosMock.get.mockResolvedValue({ data: [holidays] });

      // Act
      const action = await runThunk(loadCalendars(undefined));

      // Assert
      expect(action.type).toBe(loadCalendars.fulfilled.type);
    });

    test('rejects with the status and error message from the service response', async () => {
      // Arrange
      axiosMock.get.mockRejectedValue(axiosError(404, { errorMessage: 'Tenant not found' }));

      // Act
      const action = await runThunk(loadCalendars({ tenantName: 'unknown' }));

      // Assert
      expect(action.payload).toEqual({ status: 404, message: 'Tenant not found' });
    });

    test('rejects with the request error message when the response has no error message', async () => {
      // Arrange
      axiosMock.get.mockRejectedValue(axiosError(500, {}));

      // Act
      const action = await runThunk(loadCalendars({}));

      // Assert
      expect(action.payload).toEqual({ status: 500, message: 'Request failed with status code 500' });
    });

    test('rejects without a payload when a non-request error is thrown', async () => {
      // Arrange
      axiosMock.isAxiosError.mockReturnValue(false);
      axiosMock.get.mockRejectedValue(new TypeError('Unexpected failure'));

      // Act
      const action = await runThunk(loadCalendars({}));

      // Assert
      expect(action).toMatchObject({ type: loadCalendars.rejected.type, payload: undefined });
    });
  });

  describe('calendarsSelector', () => {
    test('returns the calendars sorted by name', () => {
      // Arrange
      const state = appState({ calendars: [holidays, sprints], busy: { loading: false } });

      // Act
      const result = calendarsSelector(state);

      // Assert
      expect(result.map(({ name }) => name)).toEqual(['adsp-sprints', 'stat-holidays']);
    });

    test('does not reorder the calendars held in state', () => {
      // Arrange
      const state = appState({ calendars: [holidays, sprints], busy: { loading: false } });

      // Act
      calendarsSelector(state);

      // Assert
      expect(state.calendar.calendars).toEqual([holidays, sprints]);
    });

    test('returns an empty list when no calendars are loaded', () => {
      // Act
      const result = calendarsSelector(appState());

      // Assert
      expect(result).toEqual([]);
    });
  });

  describe('calendarsBusySelector', () => {
    test('returns the busy state', () => {
      // Arrange
      const state = appState({ calendars: [], busy: { loading: true } });

      // Act
      const result = calendarsBusySelector(state);

      // Assert
      expect(result).toEqual({ loading: true });
    });
  });
});
