import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import { getAccessToken } from '../tenant/sagas';
import { ERROR_NOTIFICATION } from '../notifications/actions';
import {
  deleteEventDefinition as deleteEventDefinitionAction,
  deleteEventDefinitionSuccess,
  FETCH_EVENT_DEFINITIONS_SUCCESS_ACTION,
  getEventDefinitions,
  getEventDefinitionsSuccess,
  updateEventDefinition as updateEventDefinitionAction,
  updateEventDefinitionSuccess,
} from './actions';
import { EventDefinition } from './models';
import { deleteEventDefinition, fetchEventDefinitions, updateEventDefinition } from './sagas';

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
