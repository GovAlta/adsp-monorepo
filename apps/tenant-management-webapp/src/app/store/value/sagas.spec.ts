import { expectSaga } from 'redux-saga-test-plan';
import axios from 'axios';
import { getAccessToken } from '@store/tenant/sagas';
import { createValueDefinition, deleteValueDefinition, fetchValueDefinitions, updateValueDefinition } from './sagas';
import {
  CREATE_VALUE_DEFINITION_ACTION,
  DELETE_VALUE_DEFINITION_ACTION,
  DELETE_VALUE_DEFINITION_SUCCESS_ACTION,
  FETCH_VALUE_DEFINITIONS_ACTION,
  FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION,
  UPDATE_VALUE_DEFINITION_ACTION,
  UPDATE_VALUE_DEFINITION_SUCCESS_ACTION,
} from './actions';
import { ValueDefinition } from './models';

const baseUrl = 'http://mock-value-service.com';
const storeState = { config: { serviceUrls: { valueServiceApiUrl: baseUrl } } };
const headers = { headers: { Authorization: 'Bearer mock-token' } };

const definition: ValueDefinition = {
  isCore: false,
  namespace: 'test service',
  name: 'response-time',
  description: 'Response time',
  jsonSchema: { type: 'number' },
};
const definitionRequest = { name: 'response-time', description: 'Response time', jsonSchema: { type: 'number' } };

const runWithResponse = (saga, action, response: unknown) => {
  const calls = [];
  return expectSaga(saga, action)
    .withState(storeState)
    .provide({
      call(effect, next) {
        if (effect.fn === getAccessToken) {
          return 'mock-token';
        }
        if ([axios.get, axios.post, axios.patch, axios.delete].includes(effect.fn)) {
          calls.push(effect.args);
          if (response instanceof Error) {
            throw response;
          }
          return { data: response };
        }
        return next();
      },
    })
    .run()
    .then(({ effects }) => ({ calls, actions: effects.put.map((e) => e.payload.action) }));
};

describe('value definition sagas', () => {
  it('fetches tenant and core definitions from the value service', async () => {
    const { calls, actions } = await runWithResponse(
      fetchValueDefinitions,
      { type: FETCH_VALUE_DEFINITIONS_ACTION },
      {
        tenant: { 'test service': { name: 'test service', definitions: { 'response-time': definitionRequest } } },
        core: { platform: { name: 'platform', definitions: { count: { ...definitionRequest, name: 'count' } } } },
      }
    );

    expect(calls).toEqual([[`${baseUrl}/value/v1/definitions`, headers]]);
    expect(actions.find((a) => a.type === FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION).results).toEqual([
      definition,
      { ...definitionRequest, name: 'count', namespace: 'platform', isCore: true },
    ]);
  });

  it('reports fetch errors', async () => {
    const { actions } = await runWithResponse(
      fetchValueDefinitions,
      { type: FETCH_VALUE_DEFINITIONS_ACTION },
      new Error('failed')
    );

    expect(actions.find((a) => a.type === FETCH_VALUE_DEFINITIONS_SUCCESS_ACTION)).toBeUndefined();
    expect(actions[actions.length - 1].payload).toEqual({ show: false });
  });

  it('creates a definition', async () => {
    const { calls, actions } = await runWithResponse(
      createValueDefinition,
      { type: CREATE_VALUE_DEFINITION_ACTION, definition },
      definition
    );

    expect(calls).toEqual([
      [`${baseUrl}/value/v1/definitions`, { namespace: 'test service', ...definitionRequest }, headers],
    ]);
    expect(actions).toContainEqual({ type: UPDATE_VALUE_DEFINITION_SUCCESS_ACTION, definition });
  });

  it('updates a definition', async () => {
    const { calls, actions } = await runWithResponse(
      updateValueDefinition,
      { type: UPDATE_VALUE_DEFINITION_ACTION, definition },
      definition
    );

    expect(calls).toEqual([
      [`${baseUrl}/value/v1/definitions/test%20service/response-time`, definitionRequest, headers],
    ]);
    expect(actions).toContainEqual({ type: UPDATE_VALUE_DEFINITION_SUCCESS_ACTION, definition });
  });

  it('deletes a definition', async () => {
    const { calls, actions } = await runWithResponse(
      deleteValueDefinition,
      { type: DELETE_VALUE_DEFINITION_ACTION, definition },
      { deleted: true }
    );

    expect(calls).toEqual([[`${baseUrl}/value/v1/definitions/test%20service/response-time`, headers]]);
    expect(actions).toContainEqual({ type: DELETE_VALUE_DEFINITION_SUCCESS_ACTION, definition });
  });

  it('reports write errors', async () => {
    const { actions } = await runWithResponse(
      createValueDefinition,
      { type: CREATE_VALUE_DEFINITION_ACTION, definition },
      new Error('conflict')
    );

    expect(actions.find((a) => a.type === UPDATE_VALUE_DEFINITION_SUCCESS_ACTION)).toBeUndefined();
    expect(actions).toHaveLength(1);
  });
});
