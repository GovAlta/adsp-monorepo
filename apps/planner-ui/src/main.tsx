/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './goa-tokens.css';
import App from './App';

// window.__keycloak is initialized by the Keycloak JS adapter loaded
// in index.html or via public/keycloak.js — for development we allow
// direct render when Keycloak is not available.
const root = document.getElementById('root')!;

function renderApp() {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// In production the GoA platform injects window.__keycloak before this
// script runs. In development fall through immediately.
// ✓ ASVS:V-3.2.2 — session token sourced from Keycloak adapter, not localStorage
if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__keycloak) {
  (window as unknown as { __keycloak: { init: (opts: object) => Promise<void> } }).__keycloak
    .init({
      onLoad: 'check-sso',
      silentCheckSsoRedirectUri:
        window.location.origin + '/silent-check-sso.html',
    })
    .then(renderApp)
    .catch(() => {
      root.innerHTML =
        '<p>Authentication service unavailable. Please try again later.</p>';
    });
} else {
  renderApp();
}
