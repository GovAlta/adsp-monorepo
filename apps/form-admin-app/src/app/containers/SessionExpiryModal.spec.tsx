import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { SessionExpiryModal } from './SessionExpiryModal';

const mockExpiry = { showAlert: true, secondsTilExpiry: 2 };
jest.mock('../state', () => ({
  tenantSelector: () => ({ name: 't' }),
  sessionExpirySelector: () => mockExpiry,
  logoutUser: jest.fn((payload) => ({ type: 'user/logout', payload })),
  renewSession: jest.fn(() => ({ type: 'user/renew' })),
}));

const renderModal = () => {
  const store = configureStore()({});
  const view = render(
    <Provider store={store}>
      <MemoryRouter initialEntries={['/t/forms']}>
        <SessionExpiryModal />
      </MemoryRouter>
    </Provider>,
  );
  return { store, ...view };
};

describe('SessionExpiryModal', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    Object.assign(mockExpiry, { showAlert: true, secondsTilExpiry: 2 });
  });
  afterEach(() => jest.useRealTimers());

  it('renders nothing when the alert is not shown', () => {
    mockExpiry.showAlert = false;
    const { container } = renderModal();
    expect(container.innerHTML).toBe('');
  });

  it('counts down and then shows the expired message', () => {
    renderModal();
    expect(screen.getByText('2')).toBeTruthy();
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(screen.getByText(/Your session has expired/)).toBeTruthy();
    expect(screen.queryByText('Continue working')).toBeNull();
  });

  it('logs out back to the current path with the logout flag', () => {
    const { store } = renderModal();
    fireEvent(screen.getByText('Logout'), new CustomEvent('_click'));
    expect(store.getActions()).toEqual([
      { type: 'user/logout', payload: { tenant: { name: 't' }, from: '/t/forms?logout=true' } },
    ]);
  });

  it('renews the session on Continue working', () => {
    const { store } = renderModal();
    fireEvent(screen.getByText('Continue working'), new CustomEvent('_click'));
    expect(store.getActions()).toEqual([{ type: 'user/renew' }]);
  });
});
