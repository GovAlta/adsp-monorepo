import React from 'react';
import ReactDOM from 'react-dom';

import App from './app/app';
import { Provider } from 'react-redux';
import { store } from './app/store/index'

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);
