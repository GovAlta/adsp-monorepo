import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import '@abgov/web-components';

import App from './app/app';
import { store } from './app/store';
import { initializeConfig } from './app/store/config/slice';

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </Provider>,
);

store.dispatch(initializeConfig());
