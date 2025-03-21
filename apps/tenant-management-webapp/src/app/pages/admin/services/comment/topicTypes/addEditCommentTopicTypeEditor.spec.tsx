import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { AddEditCommentTopicTypeEditor } from './addEditCommentTopicTypeEditor';

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

describe('Comment Component', () => {
  const mockStore = configureStore([]);
  const store = mockStore({
    comment: {
      topicTypes: [
        {
          id: 'Hello',
          name: 'Hello',
          adminRoles: ['stream-listener', 'offline_access'],
          commenterRoles: [],
          readerRoles: [],
          securityClassification: 'protected a',
        },
      ],
    },
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
        <AddEditCommentTopicTypeEditor />
      </Provider>
    );
    const saveButton = baseElement.querySelector("goa-button[testId='comment-save']");
    fireEvent.click(saveButton);
    await waitFor(() => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      expect(require('react-router-dom').useHistory().push).not.toHaveBeenCalled();
    });
  });
});
