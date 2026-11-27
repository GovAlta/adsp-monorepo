import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import { PublicApp } from './publicApp';

jest.mock('../assets/goa-logo.svg', () => 'logo.svg');
jest.mock('@core-services/app-common', () => ({ Footer: () => <div />, Recaptcha: () => <div data-testid="recaptcha" /> }));
jest.mock('./notificationBanner', () => ({ NotificationBanner: () => <div /> }));
jest.mock('@components/AppHeader', () => () => <div />, { virtual: true });
jest.mock('@pages/public/Subscriptions', () => () => <div data-testid="public-subscriptions" />, { virtual: true });
jest.mock('@pages/public/Login', () => () => <div data-testid="login" />, { virtual: true });
jest.mock('@pages/public/LogoutRedirect', () => () => <div data-testid="logout-redirect" />, { virtual: true });
jest.mock('@pages/public/Landing', () => () => <div data-testid="landing" />, { virtual: true });
jest.mock('@store/config/actions', () => ({ recaptchaScriptLoaded: () => ({ type: 'config/recaptcha' }) }), {
  virtual: true,
});

const renderAt = (path: string, config: Record<string, unknown> = {}) =>
  render(
    <Provider store={configureStore()({ config })}>
      <MemoryRouter initialEntries={[path]}>
        <PublicApp />
      </MemoryRouter>
    </Provider>,
  );

describe('PublicApp', () => {
  it.each([
    ['/', 'landing'],
    ['/overview', 'landing'],
    ['/logout-redirect', 'logout-redirect'],
    ['/my-realm/login', 'login'],
    ['/subscriber-1', 'public-subscriptions'],
  ])('routes %s to %s', (path, testId) => {
    renderAt(path);
    expect(screen.getByTestId(testId)).toBeTruthy();
  });

  it('loads recaptcha only with a site key', () => {
    renderAt('/overview', { recaptchaKey: 'key' });
    expect(screen.getByTestId('recaptcha')).toBeTruthy();
  });
});
