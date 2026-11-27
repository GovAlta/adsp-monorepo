import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';

const mockStore = configureStore()({ config: {} });
jest.mock('@style/app.css', () => ({}), { virtual: true });
jest.mock('@style/colors.scss', () => ({}), { virtual: true });
jest.mock('@abgov/web-components/index.css', () => ({}));
jest.mock('@abgov/design-tokens/dist/tokens.css', () => ({}));
jest.mock('@store/index', () => ({ store: mockStore }), { virtual: true });
jest.mock('@store/config/actions', () => ({ fetchConfig: () => ({ type: 'config/fetch' }) }), { virtual: true });
jest.mock('@lib/authContext', () => jest.requireActual('react').createContext({}), { virtual: true });
jest.mock('theme', () => ({ theme: {} }), { virtual: true });
jest.mock('./privateApp', () => ({ PrivateApp: () => <div data-testid="private-app" /> }));
jest.mock('./publicApp', () => () => <div data-testid="public-app" />);

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { App } = require('./app');

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );

describe('subscriber App', () => {
  beforeEach(() => mockStore.clearActions());

  it('fetches config and renders no routes until keycloak config is loaded', () => {
    renderAt('/overview');
    expect(mockStore.getActions()).toEqual([{ type: 'config/fetch' }]);
    expect(screen.queryByTestId('public-app')).toBeNull();
  });

  it('routes subscriptions paths to the private app and the rest to the public app', () => {
    (mockStore.getState() as { config: Record<string, unknown> }).config.keycloakApi = {};
    const { unmount } = renderAt('/subscriptions/my-realm');
    expect(screen.getByTestId('private-app')).toBeTruthy();
    unmount();

    renderAt('/overview');
    expect(screen.getByTestId('public-app')).toBeTruthy();
    expect(mockStore.getActions()).toEqual([]);
  });
});
