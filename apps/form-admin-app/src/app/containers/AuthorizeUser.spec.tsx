import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { AuthorizeUser } from './AuthorizeUser';

const mockState = {
  initialized: true,
  user: null as { roles: string[] } | null,
  tenant: { name: 't' } as unknown,
  message: '',
};
jest.mock('../state', () => ({
  userSelector: () => ({ initialized: mockState.initialized, user: mockState.user }),
  tenantSelector: () => mockState.tenant,
  feedbackSelector: () => ({ message: mockState.message }),
  loginUser: jest.fn((payload) => ({ type: 'user/login', payload })),
}));
jest.mock('./SessionExpiryModal', () => ({ SessionExpiryModal: () => <div data-testid="expiry-modal" /> }));

const renderAuthorize = (path = '/t/forms', roles?: string[]) => {
  const store = configureStore()({});
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <AuthorizeUser roles={roles}>
          <div>Protected</div>
        </AuthorizeUser>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('AuthorizeUser', () => {
  beforeEach(() => Object.assign(mockState, { initialized: true, user: null, tenant: { name: 't' }, message: '' }));

  it('renders children for a user with a required role', () => {
    mockState.user = { roles: ['reader'] };
    renderAuthorize('/t/forms', ['reader']);
    expect(screen.getByText('Protected')).toBeTruthy();
    expect(screen.getByTestId('expiry-modal')).toBeTruthy();
  });

  it('does not render children for a user without the role', () => {
    mockState.user = { roles: ['other'] };
    renderAuthorize('/t/forms', ['reader']);
    expect(screen.queryByText('Protected')).toBeNull();
  });

  it('starts login from the current path when there is no user', () => {
    const store = renderAuthorize('/t/forms');
    expect(store.getActions()).toEqual([{ type: 'user/login', payload: { tenant: { name: 't' }, from: '/t/forms' } }]);
  });

  it('does not log in again after logout', () => {
    const store = renderAuthorize('/t/forms?logout=true');
    expect(store.getActions()).toEqual([]);
  });

  it('renders nothing protected while not initialized', () => {
    mockState.initialized = false;
    renderAuthorize();
    expect(screen.queryByText('Protected')).toBeNull();
  });
});
