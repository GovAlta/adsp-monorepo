import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as ReactDOMClient from 'react-dom/client';
import * as ReactJsxRuntime from 'react/jsx-runtime';
import * as ReactRouterDom from 'react-router-dom';
import * as AbgovReactComponents from '@abgov/react-components';
import * as AbgovWebComponents from '@abgov/web-components';
import '@abgov/web-components/index.css';
import * as IoniconsLoader from 'ionicons/loader';
import * as JsonFormsComponents from '@abgov/jsonforms-components';
import * as JsonFormsCore from '@jsonforms/core';
import * as JsonFormsReact from '@jsonforms/react';
import * as Ajv from 'ajv';
import * as AjvFormats from 'ajv-formats';
import * as AjvErrors from 'ajv-errors';

const globalScope = typeof window !== 'undefined' ? window : globalThis;
const registry = (globalScope.__BUILDER_TEMPLATE_DEPS__ =
  globalScope.__BUILDER_TEMPLATE_DEPS__ || {});

registry['react'] = React;
registry['react-dom'] = ReactDOM;
registry['react-dom/client'] = ReactDOMClient;
registry['react/jsx-runtime'] = ReactJsxRuntime;
registry['react/jsx-dev-runtime'] = ReactJsxRuntime;
registry['react-router-dom'] = ReactRouterDom;
registry['react-router'] = ReactRouterDom;
registry['@abgov/react-components'] = AbgovReactComponents;
registry['@abgov/web-components'] = AbgovWebComponents;
registry['@abgov/web-components/index.css'] = {};
registry['ionicons/loader'] = IoniconsLoader;
registry['ionicons/dist/loader'] = IoniconsLoader;
registry['@abgov/jsonforms-components'] = JsonFormsComponents;
registry['@jsonforms/core'] = JsonFormsCore;
registry['@jsonforms/react'] = JsonFormsReact;
registry['ajv'] = Ajv;
registry['ajv-formats'] = AjvFormats;
registry['ajv-errors'] = AjvErrors;