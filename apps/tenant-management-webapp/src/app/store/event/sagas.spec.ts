import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import { call } from 'redux-saga-test-plan/matchers';
import { throwError } from 'redux-saga-test-plan/providers';
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
  updateEventDefinition as updateEventDefinitionAction,
  updateEventDefinitionSuccess,
} from './actions';
import { EventDefinition } from './models';
import { dateRangeCriteria } from '../../pages/admin/event-log/util';
import { deleteEventDefinition, fetchEventDefinitions, fetchEventLogEntries, updateEventDefinition } from './sagas';

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

describe('event log period queries', () => {
  it.each(['last-hour', 'today', 'last-24-hours', 'last-7-days', 'last-30-days'] as const)(
    'sends both exact %s boundaries to the value service',
    async (preset) => {
      const criteria = dateRangeCriteria(preset, new Date('2026-10-19T18:30:45.123Z'));
      const valueUrl = 'https://value-service.example';
      const url = `${valueUrl}/value/v1/event-service/values/event?top=10&after=&timestampMax=${criteria.timestampMax}&timestampMin=${criteria.timestampMin}`;
      const response = { data: { 'event-service': { event: [] }, page: {} } };

      await expectSaga(fetchEventLogEntries, getEventLogEntries('', criteria))
        .withState({ config: { serviceUrls: { valueServiceApiUrl: valueUrl } } })
        .provide([
          [call.fn(getAccessToken), 'test-token'],
          [call.fn(axios.get), response],
        ])
        .call(axios.get, url, { headers: { Authorization: 'Bearer test-token' }, timeout: 30000 })
        .run();
    },
  );
});
