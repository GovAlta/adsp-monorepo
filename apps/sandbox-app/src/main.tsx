import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import '@abgov/web-components';
import App from './app/app';
import { initializeConfig, store } from './app/state';
import './styles.scss';

const root = createRoot(document.getElementById('root'));
root.render(
  <Provider store={store}>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </Provider>,
);

store.dispatch(initializeConfig());
