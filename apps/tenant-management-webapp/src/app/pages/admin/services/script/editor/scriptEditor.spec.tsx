import React from 'react';
import { render, fireEvent, waitFor, queryByTestId } from '@testing-library/react';
import { ScriptEditor, ScriptEditorProps } from './scriptEditor';
import { ScriptItem } from '@store/script/models';
import { Provider } from 'react-redux';
import { SESSION_INIT } from '@store/session/models';
import configureStore from 'redux-mock-store';
jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: jest.fn(),
  }),
}));
const mockScriptItem: ScriptItem = {
  description: 'function test',
  id: 'athena',
  name: 'athenan',
  runnerRoles: [
    'autotest:auto-test-role2',
    'autotest:auto-test-role1',
    'autotest:code-generator',
    'code-verifier',
    'urn:ads:autotest:acronym-service:acronym-admin',
    'urn:ads:platform:calendar-service:calendar-admin',
    'auto-test-role1',
    'CCDS_INT_SPACE_CREATION_GRANT_EXPENDITURE_OFFICER',
  ],
  script:
    '  function fact (n)\n      if n == 0 then\n        return 1\n      else\n        return n * fact(n-0)\n      end\n    end\n    \n    print("enter a number:")\n    a = io.read("*number")        -- read a number \n    print(fact(a))',
  testInputs: { testVariable: 'some data' },
  triggerEvents: [
    {
      namespace: 'auto-test-service',
      name: 'howard-test3',
      criteria: {
        context: null,
      },
    },
    {
      namespace: 'Autotest',
      name: 'autotest-addEditDeleteEvent',
      criteria: {
        context: null,
      },
    },
    {
      namespace: 'Autotest',
      name: 'Autotest-eventDefinition',
      criteria: {
        context: null,
      },
    },
    {
      namespace: 'Autotest',
      name: 'HowardTest',
      criteria: {
        context: null,
      },
    },
  ],
  useServiceAccount: false,
};
const mockScriptEditorProps: ScriptEditorProps = {
  name: 'athenan',
  description: 'function test',
  scriptStr: mockScriptItem.script,
  onNameChange: jest.fn(),
  selectedScript: mockScriptItem,
  testInput: JSON.stringify({ testVariable: 'some data' }, null, 2),
  testInputUpdate: jest.fn(),
  onDescriptionChange: jest.fn(),
  onScriptChange: jest.fn(),
  errors: {},
  saveAndReset: jest.fn(),
  onEditorCancel: jest.fn(),
  onSave: jest.fn(),
};

describe('ScriptEditor Component', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    event: {
      results: ['Autotest:HowardTest', 'Autotest:howard-test2'],
      definitions: [
        {
          name: 'HowardTest',
          description: 'test 2',
          payloadSchema: {
            type: 'object',
            properties: {},
            required: [],
            additionalProperties: true,
          },
          namespace: 'Autotest',
          isCore: false,
        },
      ],
    },
    notifications: { notifications: [] },
    pushService: {
      scripts: {
        id: 'script-execution-updates',
        name: 'Script execution updates',
        description: 'Provides update events for script execution.',
        publicSubscribe: false,
        subscriberRoles: ['urn:ads:platform:script-service:script-runner'],
        events: [
          {
            namespace: 'script-service',
            name: 'script-executed',
          },
          {
            namespace: 'script-service',
            name: 'script-execution-failed',
          },
        ],
      },
    },
    tenant: {
      realmRoles: [
        {
          name: 'testRoleA',
          id: 'test-role-a-id',
        },
        {
          name: 'testRoleB',
          id: 'test-role-b-id',
        },
      ],
    },
    scriptService: { scriptResponse: null },
    session: SESSION_INIT,
  });
  test('Save button does not route', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <ScriptEditor {...mockScriptEditorProps} />
      </Provider>
    );
    const saveButton = queryByTestId('template-form-save');
    fireEvent.click(saveButton);
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expect(require('react-router-dom').useHistory().push).not.toHaveBeenCalled();
    });
  });
});
