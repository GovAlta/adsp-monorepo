import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import { throwError } from 'redux-saga-test-plan/providers';
import { getAccessToken } from '../tenant/sagas';
import {
  deleteSharepointConnection,
  deleteSharepointDestination,
  fetchSharepointCredentialStatusSuccess,
  testSharepointDestination,
  testSharepointDestinationSuccess,
  updateSharepointConfigurationSuccess,
  updateSharepointConnection,
} from './actions';
import {
  deleteSharepointConnectionSaga,
  deleteSharepointDestinationSaga,
  testSharepointDestinationSaga,
  updateSharepointConnectionSaga,
} from './sagas';

const connection = { id: 'hr-site', name: 'HR', entraTenantId: 't', clientId: 'c', siteId: 's' };
const destination = { id: 'hr-intake', name: 'Intake', connectionId: 'hr-site', listId: 'l', fieldMappings: [] };
const configUrl = 'https://config.example/configuration/v2/configuration/platform/test-sharepoint-service';
const state = {
  config: {
    serviceUrls: {
      configurationServiceApiUrl: 'https://config.example',
      sharepointServiceApiUrl: 'https://sharepoint.example',
    },
  },
  sharepoint: { connections: {}, destinations: {}, credentialStatus: {}, testResults: {} },
};
const jsonHeaders = { headers: { Authorization: 'Bearer token', 'Content-Type': 'application/json' } };
const authHeaders = { headers: { Authorization: 'Bearer token' } };

describe('sharepoint sagas', () => {
  it('saves a connection and then its secret', () =>
    expectSaga(updateSharepointConnectionSaga, updateSharepointConnection(connection, 's3cret'))
      .withState(state)
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [
          matchers.call.fn(axios.patch),
          { data: { latest: { configuration: { connections: { 'hr-site': connection } } } } },
        ],
        [matchers.call.fn(axios.put), { data: { isSet: true, updatedAt: '2026-11-04T00:00:00Z' } }],
      ])
      .call(
        axios.patch,
        configUrl,
        { operation: 'UPDATE', update: { connections: { 'hr-site': connection } } },
        jsonHeaders,
      )
      .call(
        axios.put,
        'https://sharepoint.example/sharepoint/v1/connections/hr-site/credentials',
        { clientSecret: 's3cret' },
        authHeaders,
      )
      .put(updateSharepointConfigurationSuccess({ connections: { 'hr-site': connection }, destinations: {} }))
      .put(fetchSharepointCredentialStatusSuccess('hr-site', { isSet: true, updatedAt: '2026-11-04T00:00:00Z' }))
      .run());

  it('does not call the credential endpoint when no secret is entered', () =>
    expectSaga(updateSharepointConnectionSaga, updateSharepointConnection(connection))
      .withState(state)
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [
          matchers.call.fn(axios.patch),
          { data: { latest: { configuration: { connections: { 'hr-site': connection } } } } },
        ],
      ])
      .not.call.fn(axios.put)
      .run());

  it('deletes the credential and replaces the configuration without the connection', () =>
    expectSaga(deleteSharepointConnectionSaga, deleteSharepointConnection('hr-site'))
      .withState({
        ...state,
        sharepoint: {
          ...state.sharepoint,
          connections: { 'hr-site': connection },
          destinations: { 'hr-intake': destination },
        },
      })
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [matchers.call.fn(axios.delete), { status: 204 }],
        [matchers.call.fn(axios.patch), { data: { latest: { configuration: { connections: {} } } } }],
      ])
      .call(
        axios.delete,
        'https://sharepoint.example/sharepoint/v1/connections/hr-site/credentials',
        authHeaders,
      )
      .call(
        axios.patch,
        configUrl,
        { operation: 'REPLACE', configuration: { connections: {}, destinations: { 'hr-intake': destination } } },
        jsonHeaders,
      )
      .run());

  it('replaces the configuration without a deleted destination', () =>
    expectSaga(deleteSharepointDestinationSaga, deleteSharepointDestination('hr-intake'))
      .withState({
        ...state,
        sharepoint: {
          ...state.sharepoint,
          connections: { 'hr-site': connection },
          destinations: { 'hr-intake': destination },
        },
      })
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [matchers.call.fn(axios.patch), { data: { latest: { configuration: { connections: {} } } } }],
      ])
      .call(
        axios.patch,
        configUrl,
        { operation: 'REPLACE', configuration: { connections: { 'hr-site': connection }, destinations: {} } },
        jsonHeaders,
      )
      .run());

  it('tests a destination and stores the result', () =>
    expectSaga(testSharepointDestinationSaga, testSharepointDestination('hr-intake', { a: 1 }))
      .withState(state)
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [matchers.call.fn(axios.post), { data: { ok: false, errorCode: 'graph:invalidRequest', column: 'Nope' } }],
      ])
      .call(
        axios.post,
        'https://sharepoint.example/sharepoint/v1/destinations/hr-intake/test',
        { a: 1 },
        authHeaders,
      )
      .put(
        testSharepointDestinationSuccess('hr-intake', { ok: false, errorCode: 'graph:invalidRequest', column: 'Nope' }),
      )
      .run());

  it('records an unreachable service as the test result', () =>
    expectSaga(testSharepointDestinationSaga, testSharepointDestination('hr-intake', { a: 1 }))
      .withState(state)
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [matchers.call.fn(axios.post), throwError(Object.assign(new Error('Network Error'), { isAxiosError: true }))],
      ])
      .put(testSharepointDestinationSuccess('hr-intake', { ok: false, errorCode: 'adsp:unreachable' }))
      .run());

  it('records a rejected request as the test result', () =>
    expectSaga(testSharepointDestinationSaga, testSharepointDestination('hr-intake', { a: 1 }))
      .withState(state)
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        [
          matchers.call.fn(axios.post),
          throwError(Object.assign(new Error('Forbidden'), { isAxiosError: true, response: { status: 403 } })),
        ],
      ])
      .put(testSharepointDestinationSuccess('hr-intake', { ok: false, errorCode: 'adsp:http-403' }))
      .run());
});
