import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import LoginLanding from './Login';

jest.mock('@components/Html', () => ({ Page: () => <div data-testid="page" /> }), { virtual: true });
jest.mock(
  '@store/tenant/actions',
  () => ({
    TenantLogin: (realm: string) => ({ type: 'tenant/login', payload: realm }),
    UpdateLoginSuccess: (value: unknown) => ({ type: 'tenant/login-success', payload: value }),
  }),
  { virtual: true },
);

const renderLogin = (state: Record<string, unknown>) => {
  const store = configureStore()(state);
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/my-realm/login']}>
        <Routes>
          <Route path="/:realm/login" element={<LoginLanding />} />
          <Route path="/" element={<div data-testid="root" />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('LoginLanding', () => {
  it('logs in to the realm from the route once config is loaded', () => {
    const store = renderLogin({ config: { keycloakApi: {} }, tenant: {} });
    expect(store.getActions()).toEqual([{ type: 'tenant/login', payload: 'my-realm' }]);
  });

  it('does not log in before config is loaded', () => {
    const store = renderLogin({ config: {}, tenant: {} });
    expect(store.getActions()).toEqual([]);
  });

  it('resets and returns to the root after a failed login', () => {
    const store = renderLogin({ config: {}, tenant: { loginSucceeded: false } });
    expect(store.getActions()).toContainEqual({ type: 'tenant/login-success', payload: null });
    expect(screen.getByTestId('root')).toBeTruthy();
  });
});
