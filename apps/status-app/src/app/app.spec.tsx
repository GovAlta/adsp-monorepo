import React from 'react';
import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { getDefaultMiddleware } from '@reduxjs/toolkit';
import configureStore from 'redux-mock-store';

import App from './app';

const mockStore = configureStore(getDefaultMiddleware());
describe('App', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      config: {
        serviceUrls: {
          serviceStatusApiUrl: 'http://localhost:3338',
        },
        platformTenantRealm: '0014430f-abb9-4b57-915c-de9f3c889696',
        envLoaded: true,
      },
      subscription: {
        subscriber: null,
      },
      session: {
        notifications: [],
      },
      configuration: {
        contact: {
          contactEmail: 'fake.email@fake.server.com',
        },
      },
    });
  });
  it('should render successfully', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(baseElement).toBeTruthy();
  });

  // it('should have a greeting as the title', async () => {
  //   const { getByText } = render(
  //     <BrowserRouter>
  //       <Provider store={store}>
  //         <App />
  //       </Provider>
  //     </BrowserRouter>
  //   );

  //   await waitFor(() => expect(getByText('Real time monitoring of our applications and services')).toBeTruthy());
  // });
});
