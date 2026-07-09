import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { render } from '@testing-library/react';
import configureStore from 'redux-mock-store';

import App from './app';

const mockStore = configureStore();

describe('App', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      user: {},
      intake: {},
      start: {},
      config: {
        environment: {},
        directory: {},
        extensions: {},
        initialized: false,
      },
    });
  });

  it('should render successfully', () => {
    const { baseElement } = render(
      <MemoryRouter>
        <Provider store={store}>
          <App />
        </Provider>
      </MemoryRouter>,
    );

    expect(baseElement).toBeTruthy();
  });
});
