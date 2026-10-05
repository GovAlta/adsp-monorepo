import { expectSaga } from 'redux-saga-test-plan';
import { AGENT_RESPONSE_ACTION, AgentResponseAction, TOOL_CALL_RESULT } from '@store/agent/actions';
import {
  FETCH_CONFIGURATION_DEFINITIONS_ACTION,
  FETCH_REGISTER_DATA_ACTION,
  getRegisterDataAction,
} from '@store/configuration/action';
import { initializeFormEditorSaga, refreshDefinition, refreshDefinitionOnAgentResponse } from './sagas';

const registerCreatedResponse: AgentResponseAction = {
  type: AGENT_RESPONSE_ACTION,
  threadId: 'form-editor-thread',
  messageId: 'agent-message-1',
  chunk: {
    type: TOOL_CALL_RESULT,
    payload: {
      toolCallId: 'tool-call-1',
      toolName: 'dataRegisterCreateTool',
      args: { name: 'weekdays' },
      result: { success: true },
    },
  },
};

const putActionTypes = (effects: { put?: { payload: { action: { type: string } } }[] }) =>
  (effects.put ?? []).map((effect) => effect.payload.action.type);

describe('form sagas data register refresh', () => {
  describe('refreshDefinitionOnAgentResponse', () => {
    it('refetches the registers after an agent tool mutates the form', async () => {
      const { effects } = await expectSaga(refreshDefinitionOnAgentResponse, registerCreatedResponse)
        .provide({
          // Skips the debounce delay and the definition reload.
          call: () => undefined,
        })
        .run();

      expect(effects.put.map((effect) => effect.payload.action)).toEqual([getRegisterDataAction()]);
    });

    it('reloads the definition before refetching the registers', async () => {
      const calledFns = [];

      await expectSaga(refreshDefinitionOnAgentResponse, registerCreatedResponse)
        .provide({
          call: (effect) => {
            calledFns.push(effect.fn);
            return undefined;
          },
        })
        .run();

      expect(calledFns).toContain(refreshDefinition);
    });
  });

  describe('initializeFormEditorSaga', () => {
    const loadedState = {
      tenant: { realmRoles: [] },
      serviceRoles: { keycloak: {} },
      task: { queues: {} },
      fileService: { fileTypes: [] },
      configuration: {
        registers: [{ urn: 'urn:ads:platform:configuration:v2:/configuration/data-register/weekdays' }],
        tenantConfigDefinitions: { configuration: {}, revision: 1 },
      },
    };

    it('fetches the registers when none are loaded', async () => {
      const state = { ...loadedState, configuration: { ...loadedState.configuration, registers: [] } };

      const { effects } = await expectSaga(initializeFormEditorSaga).withState(state).run();

      expect(putActionTypes(effects)).toContain(FETCH_REGISTER_DATA_ACTION);
    });

    it('does not refetch registers that are already loaded', async () => {
      const { effects } = await expectSaga(initializeFormEditorSaga).withState(loadedState).run();

      expect(putActionTypes(effects)).not.toContain(FETCH_REGISTER_DATA_ACTION);
    });

    it('fetches the configuration definitions the preview data list needs when they are not loaded', async () => {
      const state = {
        ...loadedState,
        configuration: { ...loadedState.configuration, tenantConfigDefinitions: undefined },
      };

      const { effects } = await expectSaga(initializeFormEditorSaga).withState(state).run();

      expect(putActionTypes(effects)).toContain(FETCH_CONFIGURATION_DEFINITIONS_ACTION);
    });

    it('does not refetch configuration definitions that are already loaded', async () => {
      const { effects } = await expectSaga(initializeFormEditorSaga).withState(loadedState).run();

      expect(putActionTypes(effects)).not.toContain(FETCH_CONFIGURATION_DEFINITIONS_ACTION);
    });
  });
});
