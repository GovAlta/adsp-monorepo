import axios from 'axios';
import { expectSaga } from 'redux-saga-test-plan';
import * as matchers from 'redux-saga-test-plan/matchers';
import { throwError } from 'redux-saga-test-plan/providers';
import { getAccessToken } from '../tenant/sagas';
import {
  deleteSharepointConnection,
  deleteSharepointDestination,
  fetchSharepointCredentialStatusSuccess,
  fetchSharepointFormsSuccess,
  setUpSharepointDestination,
  setUpSharepointDestinationSuccess,
  testSharepointDestination,
  testSharepointDestinationSuccess,
  updateSharepointConfigurationSuccess,
  updateSharepointConnection,
  updateSharepointDestination,
  verifySharepointDestination,
  verifySharepointDestinationSuccess,
} from './actions';
import {
  deleteSharepointConnectionSaga,
  deleteSharepointDestinationSaga,
  fetchSharepointFormsSaga,
  setUpSharepointDestinationSaga,
  testSharepointDestinationSaga,
  updateSharepointConnectionSaga,
  updateSharepointDestinationSaga,
  verifySharepointDestinationSaga,
} from './sagas';

const connection = { id: 'hr-site', name: 'HR', entraTenantId: 't', clientId: 'c', siteId: 's' };
const destination = { id: 'hr-intake', name: 'Intake', connectionId: 'hr-site', listId: 'l', fieldMappings: [] };
const configUrl = 'https://config.example/configuration/v2/configuration/platform/sharepoint-service';
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
      .call(axios.delete, 'https://sharepoint.example/sharepoint/v1/connections/hr-site/credentials', authHeaders)
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
      .call(axios.post, 'https://sharepoint.example/sharepoint/v1/destinations/hr-intake/test', { a: 1 }, authHeaders)
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

  it('loads every form definition for Generate, following pages, and keeps only what Generate needs', () => {
    const formsUrl = 'https://config.example/configuration/v2/configuration/form-service';
    const schema = { type: 'object', properties: {} };
    return expectSaga(fetchSharepointFormsSaga)
      .withState(state)
      .provide([
        [matchers.call.fn(getAccessToken), 'token'],
        {
          call(effect, next) {
            if (effect.fn !== axios.get) {
              return next();
            }
            return effect.args[1].params.after
              ? {
                  data: {
                    results: [
                      { id: 'b', latest: { configuration: { id: 'b', name: 'Benefits', dataSchema: schema } } },
                    ],
                    page: {},
                  },
                }
              : {
                  data: {
                    results: [
                      {
                        id: 'a',
                        latest: {
                          configuration: {
                            id: 'a',
                            name: 'Applications',
                            sharepointConfigurationId: 'household',
                            submissionPdfTemplate: 'submitted-form',
                            dataSchema: schema,
                            clerkRoles: ['x'],
                          },
                        },
                      },
                      { id: 'empty', latest: null },
                    ],
                    page: { next: 'cursor-2' },
                  },
                };
          },
        },
      ])
      .call(axios.get, formsUrl, { headers: { Authorization: 'Bearer token' }, params: { top: 1000 } })
      .call(axios.get, formsUrl, {
        headers: { Authorization: 'Bearer token' },
        params: { top: 1000, after: 'cursor-2' },
      })
      .put(
        fetchSharepointFormsSuccess([
          {
            id: 'a',
            name: 'Applications',
            sharepointConfigurationId: 'household',
            submissionPdfTemplate: 'submitted-form',
            dataSchema: schema,
          },
          { id: 'b', name: 'Benefits', dataSchema: schema },
        ]),
      )
      .run();
  });

  describe('verify and set up', () => {
    const report = { ready: false, lists: [] };
    const apiUrl = (path: string) => `https://sharepoint.example/sharepoint/v1/destinations/hr-intake/${path}`;
    const withDetailList = {
      ...destination,
      idempotencyFields: ['_adsp.key'],
      detailLists: [
        { listName: 'Pets', dataPath: 'pets', parentRefField: 'ParentItemId', fieldMappings: [] },
        { listId: 'kept', dataPath: 'cars', parentRefField: 'ParentItemId', fieldMappings: [] },
      ],
    };
    const stateWith = {
      ...state,
      sharepoint: {
        ...state.sharepoint,
        destinations: { 'hr-intake': withDetailList },
        verifyResults: { 'hr-intake': { loading: true, report } },
      },
    };

    it('verifies a destination and stores the report', () =>
      expectSaga(verifySharepointDestinationSaga, verifySharepointDestination('hr-intake'))
        .withState(state)
        .provide([
          [matchers.call.fn(getAccessToken), 'token'],
          [matchers.call.fn(axios.post), { data: report }],
        ])
        .call(axios.post, apiUrl('verify'), {}, authHeaders)
        .put(verifySharepointDestinationSuccess('hr-intake', { report }))
        .run());

    it('stores the error code when verifying fails', () =>
      expectSaga(verifySharepointDestinationSaga, verifySharepointDestination('hr-intake'))
        .withState(state)
        .provide([
          [matchers.call.fn(getAccessToken), 'token'],
          [
            matchers.call.fn(axios.post),
            throwError(
              Object.assign(new Error('Conflict'), {
                isAxiosError: true,
                response: { status: 409, data: { errorCode: 'credential-not-set' } },
              }),
            ),
          ],
        ])
        .put(verifySharepointDestinationSuccess('hr-intake', { errorCode: 'credential-not-set' }))
        .run());

    it('sets up a destination and saves the IDs of the lists it created', () => {
      const setup = {
        createdLists: [{ index: 0, dataPath: 'pets', listName: 'Pets', listId: 'new-list' }],
        createdColumns: [],
        indexedColumns: [],
        failures: [],
        permissionDenied: false,
      };
      const saved = {
        ...withDetailList,
        detailLists: [{ ...withDetailList.detailLists[0], listId: 'new-list' }, withDetailList.detailLists[1]],
      };
      return expectSaga(setUpSharepointDestinationSaga, setUpSharepointDestination('hr-intake'))
        .withState(stateWith)
        .provide([
          [matchers.call.fn(getAccessToken), 'token'],
          [matchers.call.fn(axios.post), { data: { ...setup, report } }],
          [
            matchers.call.fn(axios.patch),
            { data: { latest: { configuration: { destinations: { 'hr-intake': saved } } } } },
          ],
        ])
        .call(axios.post, apiUrl('setup'), {}, authHeaders)
        .call(
          axios.patch,
          configUrl,
          { operation: 'UPDATE', update: { destinations: { 'hr-intake': saved } } },
          jsonHeaders,
        )
        .put(setUpSharepointDestinationSuccess('hr-intake', { report, setup }))
        .run();
    });

    it('saves the ID of the document library setup created', () => {
      const setup = {
        createdLists: [],
        createdLibrary: { libraryName: 'Applicant documents', libraryId: 'new-library' },
        createdColumns: [],
        indexedColumns: [],
        failures: [],
        permissionDenied: false,
      };
      const saved = { ...withDetailList, documentFilesLibraryId: 'new-library' };
      return expectSaga(setUpSharepointDestinationSaga, setUpSharepointDestination('hr-intake'))
        .withState(stateWith)
        .provide([
          [matchers.call.fn(getAccessToken), 'token'],
          [matchers.call.fn(axios.post), { data: { ...setup, report } }],
          [
            matchers.call.fn(axios.patch),
            { data: { latest: { configuration: { destinations: { 'hr-intake': saved } } } } },
          ],
        ])
        .call(
          axios.patch,
          configUrl,
          { operation: 'UPDATE', update: { destinations: { 'hr-intake': saved } } },
          jsonHeaders,
        )
        .run();
    });

    it('does not save the destination when setup created no lists or library', () =>
      expectSaga(setUpSharepointDestinationSaga, setUpSharepointDestination('hr-intake'))
        .withState(stateWith)
        .provide([
          [matchers.call.fn(getAccessToken), 'token'],
          [
            matchers.call.fn(axios.post),
            {
              data: {
                createdLists: [],
                createdColumns: [],
                indexedColumns: [],
                failures: [],
                permissionDenied: true,
                report,
              },
            },
          ],
        ])
        .not.call.fn(axios.patch)
        .run());

    it('keeps the last report and records the lists whose names are taken', () => {
      const lists = [{ index: 0, dataPath: 'pets', listName: 'Pets', listId: 'existing' }];
      return expectSaga(setUpSharepointDestinationSaga, setUpSharepointDestination('hr-intake'))
        .withState(stateWith)
        .provide([
          [matchers.call.fn(getAccessToken), 'token'],
          [
            matchers.call.fn(axios.post),
            throwError(
              Object.assign(new Error('Conflict'), {
                isAxiosError: true,
                response: { status: 409, data: { errorCode: 'list-name-taken', lists } },
              }),
            ),
          ],
        ])
        .put(setUpSharepointDestinationSuccess('hr-intake', { report, listNameTaken: lists }))
        .run();
    });

    it('verifies a destination after saving it when asked', () =>
      expectSaga(updateSharepointDestinationSaga, updateSharepointDestination(destination, true))
        .withState(state)
        .provide([
          [matchers.call.fn(getAccessToken), 'token'],
          [matchers.call.fn(axios.patch), { data: { latest: { configuration: {} } } }],
        ])
        .put(verifySharepointDestination('hr-intake'))
        .run());

    it('reports a failed save instead of verifying', () =>
      expectSaga(updateSharepointDestinationSaga, updateSharepointDestination(destination, true))
        .withState(state)
        .provide([
          [matchers.call.fn(getAccessToken), 'token'],
          [matchers.call.fn(axios.patch), throwError(new Error('boom'))],
        ])
        .put(verifySharepointDestinationSuccess('hr-intake', { errorCode: 'adsp:save-failed' }))
        .not.put(verifySharepointDestination('hr-intake'))
        .run());
  });
});
