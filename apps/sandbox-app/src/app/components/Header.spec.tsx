import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import Header from './Header';

const mockState = {
  user: null as { name: string } | null,
  tenant: { name: 'my-tenant' } as { name?: string } | null,
  keepAlive: false,
};
jest.mock('../state', () => ({
  configInitializedSelector: () => true,
  tenantSelector: () => mockState.tenant,
  userSelector: () => ({ initialized: true, user: mockState.user }),
  sessionKeepAliveSelector: () => mockState.keepAlive,
  initializeTenant: jest.fn((payload) => ({ type: 'user/initialize-tenant', payload })),
  logoutUser: jest.fn((payload) => ({ type: 'user/logout', payload })),
}));
jest.mock('../hooks/useSessionRefresh', () => ({ useSessionRefresh: jest.fn() }));
jest.mock('./SessionExpiryModal', () => ({ SessionExpiryModal: () => <div data-testid="expiry-modal" /> }));

const renderHeader = () => {
  const store = configureStore()({});
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/my-tenant/event']}>
        <Routes>
          <Route path="/:tenant/*" element={<Header />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('Header', () => {
  beforeEach(() => Object.assign(mockState, { user: null, tenant: { name: 'my-tenant' }, keepAlive: false }));

  it('initializes the tenant from the route', () => {
    expect(renderHeader().getActions()).toEqual([{ type: 'user/initialize-tenant', payload: 'my-tenant' }]);
  });

  it('hides account actions when signed out', () => {
    renderHeader();
    expect(screen.queryByText('Sign out')).toBeNull();
    expect(screen.queryByTestId('expiry-modal')).toBeNull();
  });

  it('signs out to the tenant root', () => {
    mockState.user = { name: 'Tester' };
    const store = renderHeader();
    expect(screen.getByText('Tester')).toBeTruthy();
    expect(screen.getByTestId('expiry-modal')).toBeTruthy();
    fireEvent(screen.getByText('Sign out'), new CustomEvent('_click'));
    expect(store.getActions()).toContainEqual({
      type: 'user/logout',
      payload: { tenant: { name: 'my-tenant' }, from: '/my-tenant' },
    });
  });

  it('signs out to the current path when the tenant has no name', () => {
    mockState.user = { name: 'Tester' };
    mockState.tenant = {};
    const store = renderHeader();
    fireEvent(screen.getByText('Sign out'), new CustomEvent('_click'));
    expect(store.getActions()).toContainEqual({ type: 'user/logout', payload: { tenant: {}, from: '/my-tenant/event' } });
  });

  it('hides the expiry modal when the session is kept alive', () => {
    mockState.user = { name: 'Tester' };
    mockState.keepAlive = true;
    renderHeader();
    expect(screen.queryByTestId('expiry-modal')).toBeNull();
  });
});
