import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactJsxRuntime from 'react/jsx-runtime';
import * as ReactRouterDom from 'react-router-dom';
import * as AbgovReactComponents from '@abgov/react-components';
import * as AbgovWebComponents from '@abgov/web-components';
import '@abgov/design-tokens/dist/tokens.css';
import '@abgov/web-components/index.css';
import * as IoniconsLoader from 'ionicons/loader';
import { setAssetPath as setIoniconsAssetPath } from 'ionicons';
import * as JsonFormsComponents from '@abgov/jsonforms-components';
import * as JsonFormsCore from '@jsonforms/core';
import * as JsonFormsReact from '@jsonforms/react';
import * as Ajv from 'ajv';
import * as AjvFormats from 'ajv-formats';
import * as AjvErrors from 'ajv-errors';

const globalScope = typeof window !== 'undefined' ? window : globalThis;
const registry = (globalScope.__BUILDER_TEMPLATE_DEPS__ =
  globalScope.__BUILDER_TEMPLATE_DEPS__ || {});

// Patch MemoryRouter to restore the initial route from the builder and report
// navigation events back to the parent frame so nav state is preserved when the
// agent modifies files. Runs inside the preview iframe — window.parent is the
// builder app, not the host page.
const { MemoryRouter: _MemoryRouter, useLocation: _useLocation } = ReactRouterDom;

function _RouteTracker() {
  const location = _useLocation();
  React.useEffect(() => {
    const path = location.pathname + (location.search || '');
    try {
      window.parent.postMessage({ type: 'preview:route-changed', path }, '*');
    } catch {}
  }, [location.pathname, location.search]);
  return null;
}

function _PatchedMemoryRouter({ children, ...props }) {
  const initialRoute = (typeof window !== 'undefined' && window.__BUILDER_INITIAL_ROUTE__) || '/';
  return React.createElement(
    _MemoryRouter,
    { initialEntries: [initialRoute], ...props },
    React.createElement(_RouteTracker, null),
    children,
  );
}
_PatchedMemoryRouter.displayName = 'MemoryRouter';

const PatchedReactRouterDom = { ...ReactRouterDom, MemoryRouter: _PatchedMemoryRouter };

registry['react'] = React;
registry['react-dom'] = ReactDOM;
registry['react-dom/client'] = ReactDOMClient;
registry['react/jsx-runtime'] = ReactJsxRuntime;
registry['react/jsx-dev-runtime'] = ReactJsxRuntime;
registry['react-router-dom'] = PatchedReactRouterDom;
registry['react-router'] = PatchedReactRouterDom;
registry['@abgov/react-components'] = AbgovReactComponents;
registry['@abgov/web-components'] = AbgovWebComponents;
registry['@abgov/design-tokens/dist/tokens.css'] = {};
registry['@abgov/web-components/index.css'] = {};
registry['ionicons/loader'] = IoniconsLoader;
registry['ionicons/dist/loader'] = IoniconsLoader;
registry['@abgov/jsonforms-components'] = JsonFormsComponents;
registry['@jsonforms/core'] = JsonFormsCore;
registry['@jsonforms/react'] = JsonFormsReact;
registry['ajv'] = Ajv;
registry['ajv-formats'] = AjvFormats;
registry['ajv-errors'] = AjvErrors;

// Ionicons lazily fetches SVG files at runtime via getAssetPath(), which
// resolves relative to document.baseURI. In a srcdoc iframe, baseURI is
// "about:srcdoc" which produces invalid fetch URLs. Point to jsDelivr so
// icons load regardless of the iframe's origin context.
setIoniconsAssetPath(`https://cdn.jsdelivr.net/npm/ionicons@8.0.13/dist/`);
