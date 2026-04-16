import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ConnectionsView } from './connectionsView';
import { SESSION_INIT } from '@store/session/models';

describe('ConnectionsView', () => {
  const mockStore = configureStore([]);

  it('renders add connection button', () => {
    const store = mockStore({
      sharepoint: {
        connections: {
          'connection-1': {
            id: 'connection-1',
            tenantId: 'tenant-1',
            siteId: 'site-1',
            listId: 'list-1',
            clientId: 'client-1',
          },
        },
      },
      session: SESSION_INIT,
    });

    const { baseElement } = render(
      <Provider store={store}>
        <ConnectionsView activeEdit={false} />
      </Provider>,
    );

    const addButton = baseElement.querySelector('goa-button');
    expect(addButton).not.toBeNull();
  });
});
