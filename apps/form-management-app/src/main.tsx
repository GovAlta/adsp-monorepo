import React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import '@abgov/web-components';
import App from './app/app';
import { initializeConfig, store } from './app/state';

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <App />
  </Provider>
);

store.dispatch(initializeConfig());
