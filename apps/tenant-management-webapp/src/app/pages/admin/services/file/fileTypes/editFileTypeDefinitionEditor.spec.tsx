import React from 'react';
import { render, fireEvent, waitFor, queryByTestId } from '@testing-library/react';
import { EditFileTypeDefinitionEditor } from './editFileTypeDefinitionEditor';
import { ScriptItem } from '@store/script/models';
import { Provider } from 'react-redux';
import { SESSION_INIT } from '@store/session/models';
import configureStore from 'redux-mock-store';
jest.mock('react-router-dom', () => ({
  useParams: () => ({
    id: '122',
  }),
  useNavigate: () => jest.fn(),
  useHistory: () => ({
    push: jest.fn(),
  }),
  useRouteMatch: () => ({ url: '/form/edit/A-really-really-long-formservice' }),
}));
describe('ScriptEditor Component', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    fileService: {
      fileTypes: [
        {
          id: '12345edfg',
          name: '12345edfg',
          updateRoles: [],
          readRoles: [],
          anonymousRead: false,
          securityClassification: 'protected a',
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
        <EditFileTypeDefinitionEditor />
      </Provider>
    );
    const saveButton = queryByTestId('form-save');
    fireEvent.click(saveButton);
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expect(require('react-router-dom').useHistory().push).not.toHaveBeenCalled();
    });
  });
});
