import React from 'react';
import ReactDOM from 'react-dom/client';
import { defineCustomElements as defineIonicons } from 'ionicons/loader';
import '@abgov/web-components';
import '@abgov/web-components/index.css';
import '@abgov/design-tokens/dist/tokens.css';
import App from './App';
import './styles.css';

defineIonicons(window);

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
