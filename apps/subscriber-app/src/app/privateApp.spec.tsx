import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { PrivateApp } from './privateApp';

jest.mock('../assets/goa-logo.svg', () => 'logo.svg');
jest.mock('@core-services/app-common', () => ({ Footer: () => <div /> }));
jest.mock('./notificationBanner', () => ({ NotificationBanner: () => <div /> }));
jest.mock('@components/AppHeader', () => () => <div />, { virtual: true });
jest.mock('@lib/headerContext', () => ({ HeaderCtx: jest.requireActual('react').createContext({}) }), {
  virtual: true,
});
jest.mock(
  '@store/tenant/actions',
  () => ({ KeycloakRefreshToken: (realm: string) => ({ type: 'tenant/refresh', payload: realm }) }),
  { virtual: true },
);
jest.mock(
  '@store/config/actions',
  () => ({ UpdateConfigRealm: (realm: string) => ({ type: 'config/realm', payload: realm }) }),
  { virtual: true },
);
jest.mock(
  '@pages/private/Subscriptions/Subscriptions',
  () =>
    ({ realm }: { realm: string }) =>
      <div data-testid="subscriptions">{realm}</div>,
  { virtual: true },
);
jest.mock('@pages/private/Subscriptions/SmsRedirect', () => () => <div data-testid="sms-redirect" />, {
  virtual: true,
});

const renderAt = (path: string) => {
  const store = configureStore()({});
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/subscriptions/:realm/*" element={<PrivateApp />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );
  return store;
};

describe('PrivateApp', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('sets the realm and renders subscriptions for it', () => {
    const store = renderAt('/subscriptions/my-realm');
    expect(store.getActions()).toEqual([{ type: 'config/realm', payload: 'my-realm' }]);
    expect(screen.getByTestId('subscriptions').textContent).toBe('my-realm');
  });

  it('routes sms links relative to the realm', () => {
    renderAt('/subscriptions/my-realm/sms/123456');
    expect(screen.getByTestId('sms-redirect')).toBeTruthy();
  });

  it('refreshes the token every two minutes', () => {
    const store = renderAt('/subscriptions/my-realm');
    jest.advanceTimersByTime(120 * 1000);
    expect(store.getActions()).toContainEqual({ type: 'tenant/refresh', payload: 'my-realm' });
  });
});
