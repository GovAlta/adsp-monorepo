import sharepointReducer from './reducers';
import {
  fetchSharepointConfigurationSuccess,
  fetchSharepointCredentialStatusSuccess,
  fetchSharepointForms,
  fetchSharepointFormsSuccess,
  setUpSharepointDestination,
  setUpSharepointDestinationSuccess,
  testSharepointDestination,
  testSharepointDestinationSuccess,
  updateSharepointConfigurationSuccess,
  updateSharepointDestination,
  verifySharepointDestination,
  verifySharepointDestinationSuccess,
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
    let state = sharepointReducer(
      undefined,
      testSharepointDestinationSuccess('hr-intake', { ok: true, outcome: 'created' }),
    );
    state = sharepointReducer(state, testSharepointDestination('hr-intake', {}));
    expect(state.testResults['hr-intake']).toBeUndefined();
    state = sharepointReducer(
      state,
      testSharepointDestinationSuccess('hr-intake', { ok: false, errorCode: 'graph:invalidRequest', column: 'Nope' }),
    );
    expect(state.testResults['hr-intake']).toEqual({ ok: false, errorCode: 'graph:invalidRequest', column: 'Nope' });
  });

  it('stores the forms for Generate, which are not loaded until fetched', () => {
    expect(sharepointReducer(undefined, fetchSharepointForms()).forms).toBeUndefined();
    const forms = [{ id: 'housing', name: 'Housing' }];
    expect(sharepointReducer(undefined, fetchSharepointFormsSuccess(forms)).forms).toEqual(forms);
  });

  describe('verify and set up', () => {
    const report = { ready: true, lists: [] };

    it('marks a destination as checking, keeping its last report until the new one arrives', () => {
      let state = sharepointReducer(undefined, verifySharepointDestinationSuccess('hr-intake', { report }));
      state = sharepointReducer(state, verifySharepointDestination('hr-intake'));
      expect(state.verifyResults['hr-intake']).toEqual({ loading: true, report });

      state = sharepointReducer(
        state,
        verifySharepointDestinationSuccess('hr-intake', { report: { ready: false, lists: [] } }),
      );
      expect(state.verifyResults['hr-intake']).toEqual({ loading: false, report: { ready: false, lists: [] } });
    });

    it('stores what a setup did, or the lists whose names were already taken', () => {
      const setup = { createdLists: [], createdColumns: [], indexedColumns: [], failures: [], permissionDenied: true };
      let state = sharepointReducer(undefined, setUpSharepointDestination('hr-intake'));
      expect(state.verifyResults['hr-intake'].loading).toBe(true);

      state = sharepointReducer(state, setUpSharepointDestinationSuccess('hr-intake', { report, setup }));
      expect(state.verifyResults['hr-intake']).toEqual({ loading: false, report, setup });

      const listNameTaken = [{ index: 0, dataPath: 'pets', listName: 'Pets', listId: 'l2' }];
      state = sharepointReducer(state, setUpSharepointDestinationSuccess('hr-intake', { report, listNameTaken }));
      expect(state.verifyResults['hr-intake']).toEqual({ loading: false, report, listNameTaken });
    });

    it('clears the last report when a destination is saved and will be verified', () => {
      let state = sharepointReducer(undefined, verifySharepointDestinationSuccess('hr-intake', { report }));
      state = sharepointReducer(state, updateSharepointDestination(destination, true));
      expect(state.verifyResults['hr-intake']).toEqual({ loading: true });

      state = sharepointReducer(state, verifySharepointDestinationSuccess('hr-intake', { report }));
      state = sharepointReducer(state, updateSharepointDestination(destination));
      expect(state.verifyResults['hr-intake']).toEqual({ loading: false, report });
    });
  });
});
