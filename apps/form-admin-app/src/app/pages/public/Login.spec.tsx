import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import LoginLanding from './Login';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockState = { configInitialized: true, tenant: null as unknown, message: '' };
jest.mock('../../state', () => ({
  configInitializedSelector: () => mockState.configInitialized,
  tenantSelector: () => mockState.tenant,
  feedbackSelector: () => ({ message: mockState.message }),
  initializeTenant: jest.fn((payload) => ({ type: 'user/initialize-tenant', payload })),
  loginUser: jest.fn((payload) => ({ type: 'user/login', payload })),
}));

const renderLogin = () => {
  const store = configureStore()({});
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/my-tenant/login']}>
        <Routes>
          <Route path="/:tenant/login" element={<LoginLanding />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('LoginLanding', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    Object.assign(mockState, { configInitialized: true, tenant: null, message: '' });
  });

  it('initializes the tenant from the route param', () => {
    expect(renderLogin().getActions()).toEqual([{ type: 'user/initialize-tenant', payload: 'my-tenant' }]);
  });

  it('does not initialize before config is ready', () => {
    mockState.configInitialized = false;
    expect(renderLogin().getActions()).toEqual([]);
  });

  it('logs in once the tenant is loaded', () => {
    mockState.tenant = { name: 'my-tenant' };
    expect(renderLogin().getActions()).toContainEqual({
      type: 'user/login',
      payload: { tenant: { name: 'my-tenant' }, from: '/my-tenant' },
    });
  });

  it('navigates to overview when the tenant is not found', () => {
    mockState.message = 'Tenant not found';
    renderLogin();
    expect(mockNavigate).toHaveBeenCalledWith('/overview');
  });
});
