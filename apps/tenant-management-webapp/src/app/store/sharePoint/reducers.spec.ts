import sharepointReducer from './reducers';
import {
  fetchSharepointConfigurationSuccess,
  fetchSharepointCredentialStatusSuccess,
  testSharepointDestination,
  testSharepointDestinationSuccess,
  updateSharepointConfigurationSuccess,
} from './actions';

const connection = { id: 'hr-site', name: 'HR', entraTenantId: 't', clientId: 'c', siteId: 's' };
const destination = {
  id: 'hr-intake',
  name: 'Intake',
  connectionId: 'hr-site',
  listId: 'l',
  fieldMappings: [{ source: 'a', target: 'A' }],
};

describe('sharepointReducer', () => {
  it('stores the fetched configuration', () => {
    const state = sharepointReducer(
      undefined,
      fetchSharepointConfigurationSuccess({
        connections: { 'hr-site': connection },
        destinations: { 'hr-intake': destination },
      }),
    );
    expect(state.connections).toEqual({ 'hr-site': connection });
    expect(state.destinations).toEqual({ 'hr-intake': destination });
  });

  it('replaces the configuration after an update', () => {
    const state = sharepointReducer(
      undefined,
      updateSharepointConfigurationSuccess({ connections: {}, destinations: {} }),
    );
    expect(state.connections).toEqual({});
  });

  it('stores credential status per connection', () => {
    const state = sharepointReducer(undefined, fetchSharepointCredentialStatusSuccess('hr-site', { isSet: true }));
    expect(state.credentialStatus['hr-site']).toEqual({ isSet: true });
  });

  it('clears the old result when a test starts and stores the new one', () => {
    let state = sharepointReducer(undefined, testSharepointDestinationSuccess('hr-intake', { ok: true }));
    state = sharepointReducer(state, testSharepointDestination('hr-intake', {}));
    expect(state.testResults['hr-intake']).toBeUndefined();
    state = sharepointReducer(
      state,
      testSharepointDestinationSuccess('hr-intake', { ok: false, errorCode: 'graph:invalidRequest', column: 'Nope' }),
    );
    expect(state.testResults['hr-intake']).toEqual({ ok: false, errorCode: 'graph:invalidRequest', column: 'Nope' });
  });
});
