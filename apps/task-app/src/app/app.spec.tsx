import { Provider } from 'react-redux';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import App from './app';

const mockStore = configureStore();

describe('App', () => {
  let store, userManager;

  beforeEach(() => {
    store = mockStore({
      user: {},
      intake: {},
      start: {},
    });

    userManager = {
      signoutRedirect: jest.fn(),
      signinRedirect: jest.fn(),
    };
  });

  it('should render successfully', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <App />
      </Provider>
    );

    expect(baseElement).toBeTruthy();
  });
});
