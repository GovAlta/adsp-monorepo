import React from 'react';
import { render, fireEvent, waitFor, queryByTestId } from '@testing-library/react';
import { QueueModalEditor } from './queueModalEditor';
import { ScriptItem } from '@store/script/models';
import { Provider } from 'react-redux';
import { SESSION_INIT } from '@store/session/models';
import configureStore from 'redux-mock-store';
jest.mock('react-router-dom', () => ({
  useParams: () => ({
    id: '123:123',
  }),
  useNavigate: () => jest.fn(),
  useHistory: () => ({
    push: jest.fn(),
  }),
  useRouteMatch: () => ({ url: '/task/edit/123:123' }),
}));

describe('Task Component', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    notifications: { notifications: [] },
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
    session: SESSION_INIT,
  });
  test('Save button does not route', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <QueueModalEditor />
      </Provider>
    );
    const saveButton = baseElement.querySelector("goa-button[testId='queue-save']");
    fireEvent.click(saveButton);
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expect(require('react-router-dom').useHistory().push).not.toHaveBeenCalled();
    });
  });
});
