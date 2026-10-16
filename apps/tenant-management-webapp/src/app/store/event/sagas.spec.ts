import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga-test-plan/matchers';
import { dynamic, StaticProvider, throwError } from 'redux-saga-test-plan/providers';
import reducer from './reducers';
import { getAccessToken } from '../tenant/sagas';
import { ERROR_NOTIFICATION } from '../notifications/actions';
import {
  deleteEventDefinition as deleteEventDefinitionAction,
  deleteEventDefinitionSuccess,
  FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION,
  getEventDefinitions,
  getEventDefinitionsSuccess,
  getEventLogEntries,
  getEventLogEntriesFailed,
  getEventLogPage,
  getEventLogPageSucceeded,
  updateEventDefinition as updateEventDefinitionAction,
  updateEventDefinitionSuccess,
} from './actions';
import { EventDefinition, EventSearchCriteria } from './models';
import {
  deleteEventDefinition,
  fetchEventDefinitions,
  fetchEventLogEntries,
  fetchEventLogPage,
  updateEventDefinition,
} from './sagas';

const eventServiceUrl = 'https://event-service.example';

const tenantDefinition: EventDefinition = {
  isCore: false,
  namespace: 'application-events',
  name: 'user-registration',
  description: 'A user registered',
  payloadSchema: { type: 'object' },
};

const coreDefinition: EventDefinition = {
  ...tenantDefinition,
  namespace: 'core',
  name: 'core-event',
  isCore: true,
};

const state = {
  config: { serviceUrls: { eventServiceApiUrl: eventServiceUrl } },
  event: { definitions: { [`${tenantDefinition.namespace}:${tenantDefinition.name}`]: tenantDefinition } },
};

describe('event definition sagas', () => {
  it('clears log loading when a search fails so filters can be used again', async () => {
    const loadingState = reducer(undefined, getEventLogEntries());

    await expectSaga(fetchEventLogEntries, getEventLogEntries())
      .withState({ config: { serviceUrls: { valueServiceApiUrl: 'https://value-service.example' } } })
      .provide([
        [call.fn(getAccessToken), 'test-token'],
        [call.fn(axios.get), throwError(new Error('request failed'))],
      ])
      .put(getEventLogEntriesFailed())
      .run();

    expect(reducer(loadingState, getEventLogEntriesFailed()).isLoading.log).toBe(false);
  });
  it('fetches tenant and core definitions from the event service', async () => {
    await expectSaga(fetchEventDefinitions, getEventDefinitions())
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.get) {
            expect(effect.args[0]).toBe(`${eventServiceUrl}/event/v1/definitions`);
            return { data: [tenantDefinition, coreDefinition] };
          }
          return next();
        },
      })
      .put(getEventDefinitionsSuccess([tenantDefinition, coreDefinition]))
      .run();
  });

  it('reports an error when the fetch fails', async () => {
    await expectSaga(fetchEventDefinitions, getEventDefinitions())
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.get) {
            throw new Error('request failed');
          }
          return next();
        },
      })
      .put.like({ action: { type: ERROR_NOTIFICATION } })
      .not.put.actionType(FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION)
      .run();
  });

  it('creates a new definition via POST', async () => {
    const created = { ...tenantDefinition, name: 'new-event' };

    await expectSaga(updateEventDefinition, updateEventDefinitionAction(created))
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.post) {
            expect(effect.args[0]).toBe(`${eventServiceUrl}/event/v1/definitions`);
            expect(effect.args[1]).toEqual({
              namespace: created.namespace,
              name: created.name,
              description: created.description,
              payloadSchema: created.payloadSchema,
            });
            return { data: created };
          }
          return next();
        },
      })
      .put(updateEventDefinitionSuccess(created))
      .run();
  });

  it('updates an existing definition via PATCH', async () => {
    const updated = { ...tenantDefinition, description: 'Updated description' };

    await expectSaga(updateEventDefinition, updateEventDefinitionAction(updated))
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.patch) {
            expect(effect.args[0]).toBe(`${eventServiceUrl}/event/v1/definitions/${updated.namespace}/${updated.name}`);
            expect(effect.args[1]).toEqual({
              description: updated.description,
              payloadSchema: updated.payloadSchema,
            });
            return { data: updated };
          }
          return next();
        },
      })
      .put(updateEventDefinitionSuccess(updated))
      .run();
  });

  it('deletes a definition through the event service', async () => {
    await expectSaga(deleteEventDefinition, deleteEventDefinitionAction(tenantDefinition))
      .withState(state)
      .provide({
        call(effect, next) {
          if (effect.fn === getAccessToken) {
            return 'test-token';
          }
          if (effect.fn === axios.delete) {
            expect(effect.args[0]).toBe(
              `${eventServiceUrl}/event/v1/definitions/${tenantDefinition.namespace}/${tenantDefinition.name}`,
            );
            return { data: { deleted: true } };
          }
          return next();
        },
      })
      .put(deleteEventDefinitionSuccess(tenantDefinition))
      .run();
  });
});

describe('event log page saga', () => {
  const valueServiceUrl = 'https://value-service.example';
  const eventsUrl = `${valueServiceUrl}/value/v1/event-service/values/event`;
  const pageState = {
    config: { serviceUrls: { valueServiceApiUrl: valueServiceUrl } },
    event: { logPage: { page: 1, total: 347 } },
  };
  const loggedEvent = {
    context: { namespace: 'form-service', name: 'form-submitted' },
    timestamp: '2026-10-01T15:30:00.000Z',
    correlationId: 'urn:ads:platform:form-service:v1:/forms/a1b2c3',
    value: { payload: { formId: 'a1b2c3' } },
  };
  const searchCriteria: EventSearchCriteria = {
    namespace: 'form-service',
    name: 'form-submitted',
    timestampMin: '2026-10-01T00:00:00.000Z',
    timestampMax: '2026-10-16T12:00:00.000Z',
    correlationId: 'urn:ads:platform:form-service:v1:/forms/a1b2c3',
  };
  const filterParams = {
    context: JSON.stringify({ namespace: 'form-service', name: 'form-submitted' }),
    timestampMin: '2026-10-01T00:00:00.000Z',
    timestampMax: '2026-10-16T12:00:00.000Z',
    correlationId: 'urn:ads:platform:form-service:v1:/forms/a1b2c3',
  };
  const pageResponse = { data: { 'event-service': { event: [loggedEvent] }, page: { size: 1 } } };
  const countResponse = { data: { namespace: 'event-service', name: 'event', count: 347 } };
  const axiosGet = jest.fn();
  const providers: StaticProvider[] = [
    [call.fn(getAccessToken), 'test-token'],
    [call.fn(axios.get), dynamic((effect) => axiosGet(...effect.args))],
  ];

  afterEach(() => {
    axiosGet.mockReset();
  });

  it('requests only the events on the selected page', async () => {
    axiosGet.mockReturnValueOnce(pageResponse);

    await expectSaga(fetchEventLogPage, getEventLogPage(3, searchCriteria))
      .withState(pageState)
      .provide(providers)
      .run();

    expect(axiosGet).toHaveBeenCalledWith(
      eventsUrl,
      expect.objectContaining({ params: { ...filterParams, top: 10, after: btoa('20'), order: 'desc' } }),
    );
  });

  it('reads a page in the older half oldest first from the mirrored offset', async () => {
    axiosGet.mockReturnValueOnce(pageResponse);

    await expectSaga(fetchEventLogPage, getEventLogPage(19, searchCriteria))
      .withState(pageState)
      .provide(providers)
      .run();

    expect(axiosGet).toHaveBeenCalledWith(
      eventsUrl,
      expect.objectContaining({ params: { ...filterParams, top: 10, after: btoa('157'), order: 'asc' } }),
    );
  });

  it('reads only the remaining events for a partial last page', async () => {
    axiosGet.mockReturnValueOnce(pageResponse);

    await expectSaga(fetchEventLogPage, getEventLogPage(35, searchCriteria))
      .withState(pageState)
      .provide(providers)
      .run();

    expect(axiosGet).toHaveBeenCalledWith(
      eventsUrl,
      expect.objectContaining({ params: { ...filterParams, top: 7, after: btoa('0'), order: 'asc' } }),
    );
  });

  it('shows an oldest-first page newest first', async () => {
    const olderEvent = { ...loggedEvent, timestamp: '2026-09-01T15:30:00.000Z' };
    axiosGet.mockReturnValueOnce({ data: { 'event-service': { event: [olderEvent, loggedEvent] }, page: {} } });

    await expectSaga(fetchEventLogPage, getEventLogPage(35, searchCriteria))
      .withState(pageState)
      .provide(providers)
      .put(getEventLogPageSucceeded([loggedEvent, olderEvent], 35))
      .run();
  });

  it('does not recount the matching events when moving between pages', async () => {
    axiosGet.mockReturnValueOnce(pageResponse);

    await expectSaga(fetchEventLogPage, getEventLogPage(3, searchCriteria))
      .withState(pageState)
      .provide(providers)
      .run();

    expect(axiosGet).toHaveBeenCalledTimes(1);
  });

  it('counts the matching events with the same filters when a search starts', async () => {
    axiosGet.mockReturnValueOnce(pageResponse).mockReturnValueOnce(countResponse);

    await expectSaga(fetchEventLogPage, getEventLogPage(1, searchCriteria, true))
      .withState(pageState)
      .provide(providers)
      .run();

    expect(axiosGet).toHaveBeenCalledWith(`${eventsUrl}/count`, expect.objectContaining({ params: filterParams }));
  });

  it('stores the page of events with the total number of matching events', async () => {
    axiosGet.mockReturnValueOnce(pageResponse).mockReturnValueOnce(countResponse);

    await expectSaga(fetchEventLogPage, getEventLogPage(1, searchCriteria, true))
      .withState(pageState)
      .provide(providers)
      .put(getEventLogPageSucceeded([loggedEvent], 1, 347))
      .run();
  });

  it('stops loading and reports an error when the event log cannot be retrieved', async () => {
    await expectSaga(fetchEventLogPage, getEventLogPage(2, searchCriteria))
      .withState(pageState)
      .provide([
        [call.fn(getAccessToken), 'test-token'],
        [call.fn(axios.get), throwError(new Error('timeout of 30000ms exceeded'))],
      ])
      .put(getEventLogEntriesFailed())
      .put.like({ action: { type: ERROR_NOTIFICATION } })
      .run();
  });
});
