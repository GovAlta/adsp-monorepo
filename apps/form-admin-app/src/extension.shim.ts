import * as ABGovReactComponents from '@abgov/react-components';
import axios from 'axios';
import React from 'react';
import * as StyledComponents from 'styled-components';
// import { getAccessToken } from './app/state';

// Set properties on global for dependencies so that extensions can externalize from their bundle.
// Extension bundles are added dynamically after the app bundles, so global values should be ready when extensions are loaded.

// e.g. config.externals = { '@abgov/react-components': 'ABGovReactComponents', ... }
globalThis.ABGovReactComponents = ABGovReactComponents;
// e.g. config.externals = { 'react': 'React', ... }
globalThis.React = React;
// e.g. config.externals = { 'styled-components': 'StyledComponents', ... }
globalThis.StyledComponents = StyledComponents;

// Note: not used since thunks add token explicitly.
// Prepare an axios interceptor for setting the bearer token in Authorization header.
// axios.interceptors.request.use(async function (config) {
//   const token = await getAccessToken();
//   config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });

// e.g. config.externals = { 'axios': 'Axios', ... }
globalThis.Axios = axios;
