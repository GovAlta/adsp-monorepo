import React from 'react';
import { Provider } from 'react-redux';
import { store } from './store/index';
import { Router } from './router';

export const FormServiceCommon = ({ session, config }) => {
  return (
    <Provider store={store}>
      <Router session={session} config={config} />
    </Provider>
  );
};

export default FormServiceCommon;
