import { expectSaga } from 'redux-saga-test-plan';
import { RegisterConfigData } from '@abgov/jsonforms-components';
import { getAccessToken } from '@store/tenant/sagas';
import { ERROR_NOTIFICATION } from '@store/notifications/actions';
import { UpdateLoadingState } from '@store/session/actions';
import { createDataRegister, deleteDataRegister, fetchRegisterData, updateDataRegister } from './sagas';
import {
  createDataRegisterAction,
  CREATE_DATA_REGISTER_SUCCESS_ACTION,
  deleteDataRegisterAction,
  DELETE_DATA_REGISTER_SUCCESS_ACTION,
  FETCH_REGISTER_DATA_ACTION,
  FETCH_REGISTER_DATA_FAILED_ACTION,
  FETCH_REGISTER_DATA_SUCCESS_ACTION,
  updateDataRegisterAction,
  UPDATE_DATA_REGISTER_ACTION,
  UPDATE_DATA_REGISTER_SUCCESS_ACTION,
} from './action';
import { createRegisterApi, deleteRegisterApi, fetchRegistersApi, updateRegisterApi } from './dataRegisterApi';

const formApiUrl = 'https://form-service.adsp-dev.gov.ab.ca';
const token = 'tenant-admin-token';
const storeState = { config: { serviceUrls: { formAppApiUrl: formApiUrl } } };
const weekdaysUrn = 'urn:ads:platform:configuration:v2:/configuration/data-register/weekdays';
const weekdays: RegisterConfigData = { urn: weekdaysUrn, description: 'Days of the week', data: ['Monday'] };

const httpError = (status: number) =>
  Object.assign(new Error(`Request failed with status code ${status}`), {
    response: { status },
  });

const runSaga = (saga, action, apiFn, response: unknown, state: unknown = storeState) => {
  const calls = [];
  return expectSaga(saga, action)
    .withState(state)
    .provide({
      call(effect, next) {
        if (effect.fn === getAccessToken) {
          return token;
        }
        if (effect.fn === apiFn) {
          calls.push(effect.args);
          if (response instanceof Error) {
            throw response;
          }
          return response;
        }
        return next();
      },
    })
    .run()
    .then(({ effects }) => ({ calls, actions: effects.put?.map((e) => e.payload.action) ?? [] }));
};

const actionTypes = (actions: { type: string }[]) => actions.map((action) => action.type);

const updateLoadingState = (state: 'start' | 'completed' | 'error') =>
  UpdateLoadingState({ name: UPDATE_DATA_REGISTER_ACTION, id: 'weekdays', state });

describe('configuration data register sagas', () => {
  describe('fetchRegisterData', () => {
    it('fetches the registers from the form service', async () => {
      const { calls } = await runSaga(fetchRegisterData, { type: FETCH_REGISTER_DATA_ACTION }, fetchRegistersApi, [
        weekdays,
      ]);

      expect(calls).toEqual([[token, formApiUrl]]);
    });

    it('stores the fetched registers', async () => {
      const { actions } = await runSaga(fetchRegisterData, { type: FETCH_REGISTER_DATA_ACTION }, fetchRegistersApi, [
        weekdays,
      ]);

      expect(actions).toEqual([{ type: FETCH_REGISTER_DATA_SUCCESS_ACTION, payload: [weekdays] }]);
    });

    it('notifies the error and resets the spinner when the fetch fails', async () => {
      const { actions } = await runSaga(
        fetchRegisterData,
        { type: FETCH_REGISTER_DATA_ACTION },
        fetchRegistersApi,
        httpError(500),
      );

      expect(actionTypes(actions)).toEqual([ERROR_NOTIFICATION, FETCH_REGISTER_DATA_FAILED_ACTION]);
    });

    it('resets the spinner without calling the form service when its URL is not known yet', async () => {
      const { calls, actions } = await runSaga(
        fetchRegisterData,
        { type: FETCH_REGISTER_DATA_ACTION },
        fetchRegistersApi,
        [weekdays],
        { config: { serviceUrls: {} } },
      );

      expect({ calls, types: actionTypes(actions) }).toEqual({ calls: [], types: [FETCH_REGISTER_DATA_FAILED_ACTION] });
    });
  });

  describe('createDataRegister', () => {
    it('posts the name, description and entries to the form service', async () => {
      const { calls } = await runSaga(
        createDataRegister,
        createDataRegisterAction('weekdays', 'Days of the week', ['Monday']),
        createRegisterApi,
        weekdays,
      );

      expect(calls).toEqual([
        [token, formApiUrl, { name: 'weekdays', description: 'Days of the week', entries: ['Monday'] }],
      ]);
    });

    it('adds the created register to state', async () => {
      const { actions } = await runSaga(
        createDataRegister,
        createDataRegisterAction('weekdays', 'Days of the week', ['Monday']),
        createRegisterApi,
        weekdays,
      );

      expect(actions).toEqual([{ type: CREATE_DATA_REGISTER_SUCCESS_ACTION, payload: weekdays }]);
    });

    it('notifies the conflict and refetches when the register already exists', async () => {
      const { actions } = await runSaga(
        createDataRegister,
        createDataRegisterAction('weekdays', 'Days of the week', ['Monday']),
        createRegisterApi,
        httpError(409),
      );

      expect(actionTypes(actions)).toEqual([ERROR_NOTIFICATION, FETCH_REGISTER_DATA_ACTION]);
    });
  });

  describe('updateDataRegister', () => {
    it('patches only the entries when no description is given', async () => {
      const { calls } = await runSaga(
        updateDataRegister,
        updateDataRegisterAction('weekdays', undefined, ['Monday', 'Tuesday']),
        updateRegisterApi,
        weekdays,
      );

      expect(calls).toEqual([
        [token, formApiUrl, 'weekdays', { description: undefined, entries: ['Monday', 'Tuesday'] }],
      ]);
    });

    it('replaces the register in state with the updated one and reports the update as completed', async () => {
      const { actions } = await runSaga(
        updateDataRegister,
        updateDataRegisterAction('weekdays', undefined, ['Monday']),
        updateRegisterApi,
        weekdays,
      );

      expect(actions).toEqual([
        updateLoadingState('start'),
        { type: UPDATE_DATA_REGISTER_SUCCESS_ACTION, payload: weekdays },
        updateLoadingState('completed'),
      ]);
    });

    it('notifies the error, reports the update as failed and refetches when the update fails', async () => {
      const { actions } = await runSaga(
        updateDataRegister,
        updateDataRegisterAction('weekdays', undefined, ['Monday']),
        updateRegisterApi,
        httpError(400),
      );

      expect(actions).toEqual([
        updateLoadingState('start'),
        expect.objectContaining({ type: ERROR_NOTIFICATION }),
        updateLoadingState('error'),
        expect.objectContaining({ type: FETCH_REGISTER_DATA_ACTION }),
      ]);
    });

    it('reports the update as failed without calling the form service when its URL is not known yet', async () => {
      const { calls, actions } = await runSaga(
        updateDataRegister,
        updateDataRegisterAction('weekdays', undefined, ['Monday']),
        updateRegisterApi,
        weekdays,
        { config: { serviceUrls: {} } },
      );

      expect(calls).toEqual([]);
      expect(actions).toEqual([updateLoadingState('start'), updateLoadingState('error')]);
    });
  });

  describe('deleteDataRegister', () => {
    it('deletes the register by name', async () => {
      const { calls } = await runSaga(
        deleteDataRegister,
        deleteDataRegisterAction('weekdays', weekdaysUrn),
        deleteRegisterApi,
        undefined,
      );

      expect(calls).toEqual([[token, formApiUrl, 'weekdays']]);
    });

    it('removes the deleted register from state', async () => {
      const { actions } = await runSaga(
        deleteDataRegister,
        deleteDataRegisterAction('weekdays', weekdaysUrn),
        deleteRegisterApi,
        undefined,
      );

      expect(actions).toEqual([{ type: DELETE_DATA_REGISTER_SUCCESS_ACTION, urn: weekdaysUrn }]);
    });

    it('treats a register that is already gone as removed', async () => {
      const { actions } = await runSaga(
        deleteDataRegister,
        deleteDataRegisterAction('weekdays', weekdaysUrn),
        deleteRegisterApi,
        httpError(404),
      );

      expect(actions).toEqual([{ type: DELETE_DATA_REGISTER_SUCCESS_ACTION, urn: weekdaysUrn }]);
    });

    it('notifies the error and refetches when the delete fails', async () => {
      const { actions } = await runSaga(
        deleteDataRegister,
        deleteDataRegisterAction('weekdays', weekdaysUrn),
        deleteRegisterApi,
        httpError(502),
      );

      expect(actionTypes(actions)).toEqual([ERROR_NOTIFICATION, FETCH_REGISTER_DATA_ACTION]);
    });
  });
});
