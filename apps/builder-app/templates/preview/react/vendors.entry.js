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
import * as DataExchangeStandard from '@abgov/data-exchange-standard';
import * as JsonFormsComponents from '@abgov/jsonforms-components';
import { resolveSchemaRefs } from './resolveSchemaRefs.js';
import * as JsonFormsCore from '@jsonforms/core';
import * as JsonFormsReact from '@jsonforms/react';
import * as Ajv from 'ajv';
import * as AjvFormats from 'ajv-formats';
import * as AjvErrors from 'ajv-errors';

// Ionicons lazily fetches SVG files at runtime via getAssetPath(), which
// resolves relative to document.baseURI. In a srcdoc iframe, baseURI is
// "about:srcdoc" which produces invalid fetch URLs. Point to jsDelivr so
// icons load regardless of the iframe's origin context.
const IONICONS_ASSET_URL = 'https://cdn.jsdelivr.net/npm/ionicons@8.0.13/dist/';

// The template calls defineCustomElements(window) from main.tsx, and Stencil's
// bootstrapLazy resets the asset path from document.baseURI on every call, so
// a one-off setAssetPath at load time is overwritten. Supply resourcesUrl on
// each call instead.
const PatchedIoniconsLoader = {
  ...IoniconsLoader,
  defineCustomElements: (win, options) =>
    IoniconsLoader.defineCustomElements(win, { resourcesUrl: IONICONS_ASSET_URL, ...options }),
};

const globalScope = typeof window !== 'undefined' ? window : globalThis;
const registry = (globalScope.__BUILDER_TEMPLATE_DEPS__ = globalScope.__BUILDER_TEMPLATE_DEPS__ || {});

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

// resolveRefs/tryResolveRefs use @apidevtools/json-schema-ref-parser, which resolves against location.href and fails for
// any schema when the page is about:srcdoc (the preview iframe). Resolve with a URL-independent implementation that
// keeps the same contract: resolveRefs returns the schema or throws; tryResolveRefs returns [schema, error?].
const PatchedJsonFormsComponents = {
  ...JsonFormsComponents,
  resolveRefs: async (schema, ...refSchemas) => resolveSchemaRefs(schema, ...refSchemas),
  tryResolveRefs: async (schema, ...refSchemas) => {
    try {
      return [resolveSchemaRefs(schema, ...refSchemas)];
    } catch (err) {
      return [schema, err];
    }
  },
};

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
registry['ionicons/loader'] = PatchedIoniconsLoader;
registry['ionicons/dist/loader'] = PatchedIoniconsLoader;
registry['@abgov/data-exchange-standard'] = DataExchangeStandard;
registry['@abgov/jsonforms-components'] = PatchedJsonFormsComponents;
registry['@jsonforms/core'] = JsonFormsCore;
registry['@jsonforms/react'] = JsonFormsReact;
registry['ajv'] = Ajv;
registry['ajv-formats'] = AjvFormats;
registry['ajv-errors'] = AjvErrors;

setIoniconsAssetPath(IONICONS_ASSET_URL);
