import reducer from './reducers';
import {
  DeleteTokenHandlerClient,
  DeleteTokenHandlerClientFailed,
  DeleteTokenHandlerClientSuccess,
  GetClientRegistration,
  GetClientRegistrationFailed,
  GetClientRegistrationSuccess,
} from './actions';
import { TOKEN_HANDLER_INIT, TokenHandlerState } from './models';

describe('tokenHandler reducer', () => {
  const state: TokenHandlerState = {
    ...TOKEN_HANDLER_INIT,
    clients: { a: { id: 'a', name: 'A', targets: {} }, b: { id: 'b', name: 'B', targets: {} } },
    registrations: { a: 'kc-a', b: null },
    registrationErrors: { b: true },
    keycloakUuids: { a: 'uuid-a' },
  };

  it('stores the registration and Keycloak id', () => {
    const result = reducer(TOKEN_HANDLER_INIT, GetClientRegistrationSuccess('a', 'kc-a', 'uuid-a'));
    expect(result.registrations).toEqual({ a: 'kc-a' });
    expect(result.keycloakUuids).toEqual({ a: 'uuid-a' });
  });

  it('records an unregistered client as null', () => {
    const result = reducer(TOKEN_HANDLER_INIT, GetClientRegistrationSuccess('a', null));
    expect(result.registrations).toEqual({ a: null });
    expect(result.keycloakUuids).toEqual({});
  });

  it('clears a stale registration, error and Keycloak id when a lookup starts', () => {
    const result = reducer(state, GetClientRegistration('a'));
    expect(result.registrations).toEqual({ b: null });
    expect(result.keycloakUuids).toEqual({});
    expect(result.registrationErrors).toEqual({ b: true });
  });

  it('records a failed lookup without reporting the client as not registered', () => {
    const result = reducer(reducer(state, GetClientRegistration('c')), GetClientRegistrationFailed('c'));
    expect(result.registrationErrors.c).toBe(true);
    expect(result.registrations.c).toBeUndefined();
  });

  it('clears the error when a later lookup succeeds', () => {
    const result = reducer(
      reducer(state, GetClientRegistration('b')),
      GetClientRegistrationSuccess('b', 'kc-b', 'uuid-b'),
    );
    expect(result.registrationErrors.b).toBeUndefined();
    expect(result.registrations.b).toBe('kc-b');
  });

  it('removes the registration when the client is deleted', () => {
    const result = reducer(state, DeleteTokenHandlerClientSuccess('a'));
    expect(result.clients).toEqual({ b: state.clients.b });
    expect(result.registrations).toEqual({ b: null });
    expect(result.keycloakUuids).toEqual({});
  });

  it('is busy while a client is being deleted and is released on success or failure', () => {
    const deleting = reducer(state, DeleteTokenHandlerClient('a'));
    expect(deleting.busyClients.a).toBe(true);
    expect(reducer(deleting, DeleteTokenHandlerClientSuccess('a')).busyClients.a).toBe(false);
    expect(reducer(deleting, DeleteTokenHandlerClientFailed('a')).busyClients.a).toBe(false);
    expect(reducer(deleting, DeleteTokenHandlerClientFailed('a')).clients.a).toBeDefined();
  });
});
