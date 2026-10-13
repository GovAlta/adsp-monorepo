import { render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes } from 'react-router-dom-v7';
import configureStore from 'redux-mock-store';
import { FormAdminTenant } from './FormAdminTenant';

const mockNavigate = jest.fn();
jest.mock('react-router-dom-v7', () => ({
  ...jest.requireActual('react-router-dom-v7'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../state', () => {
  const actual = jest.requireActual('../state');
  return {
    ...actual,
    initializeTenant: jest.fn((payload) => ({ type: 'user/initialize-tenant', payload })),
  };
});

jest.mock('./AuthorizeUser', () => ({
  AuthorizeUser: ({ children }: { children: React.ReactNode }) => <div data-testid="authorize-user">{children}</div>,
}));
jest.mock('./FeedbackNotification', () => ({
  FeedbackNotification: () => <div data-testid="feedback-notification" />,
}));
jest.mock('./NavigationMenu', () => ({
  NavigationMenu: ({ type }: { type: string }) => <div data-testid={`navigation-menu-${type}`} />,
}));
jest.mock('./FormDefinitions', () => ({ FormsDefinitions: () => <div data-testid="form-definitions" /> }));
jest.mock('./FormDefinition', () => ({ FormDefinition: () => <div data-testid="form-definition" /> }));

const mockStore = configureStore();
const tenantName = 'test-tenant';

const createState = ({
  tenant = { id: 'tenant-1', name: 'Test Tenant', realm: 'test-realm' },
  configInitialized = true,
  feedbackMessage = null,
}: {
  tenant?: { id: string; name: string; realm: string } | null;
  configInitialized?: boolean;
  feedbackMessage?: string | null;
} = {}) => ({
  user: {
    tenant,
    initialized: true,
    user: { id: 'user-1', name: 'Test User', email: 'test@gov.ab.ca', roles: [] },
  },
  config: {
    initialized: configInitialized,
    extensions: {},
  },
  feedback: {
    items: feedbackMessage ? [{ id: 'feedback-1', level: 'error', message: feedbackMessage }] : [],
  },
});

const renderTenant = (path: string, store = mockStore(createState())) =>
  render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/${tenantName}${path}`]}>
        <Routes>
          <Route path="/:tenant/*" element={<FormAdminTenant />} />
        </Routes>
      </MemoryRouter>
    </Provider>,
  );

describe('FormAdminTenant', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('should show the tenant name in the header title', () => {
    const { baseElement } = renderTenant('/definitions');

    expect(baseElement.querySelector('goa-app-header').getAttribute('heading')).toBe(
      'Test Tenant - Form administration',
    );
  });

  it('should fall back to the tenant route param when the tenant name is not loaded', () => {
    const store = mockStore(createState({ tenant: null }));
    const { baseElement } = renderTenant('/definitions', store);

    expect(baseElement.querySelector('goa-app-header').getAttribute('heading')).toBe(
      `${tenantName} - Form administration`,
    );
  });

  it('should dispatch initializeTenant when the config is initialized', () => {
    const store = mockStore(createState({ configInitialized: true }));
    renderTenant('/definitions', store);

    expect(store.getActions()).toContainEqual({ type: 'user/initialize-tenant', payload: tenantName });
  });

  it('should not dispatch initializeTenant when the config is not initialized', () => {
    const store = mockStore(createState({ configInitialized: false }));
    renderTenant('/definitions', store);

    expect(store.getActions().map(({ type }) => type)).not.toContain('user/initialize-tenant');
  });

  it('should navigate to overview when feedback reports the tenant was not found', () => {
    const store = mockStore(createState({ feedbackMessage: 'Tenant not found' }));
    renderTenant('/definitions', store);

    expect(mockNavigate).toHaveBeenCalledWith('/overview');
  });

  it('should not navigate when feedback does not report the tenant was not found', () => {
    const store = mockStore(createState({ feedbackMessage: 'Error encountered' }));
    renderTenant('/definitions', store);

    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('should show the definitions list for the definitions route', () => {
    const { getByTestId } = renderTenant('/definitions');

    expect(getByTestId('form-definitions')).toBeTruthy();
  });

  it('should show the form definition for a selected definition route', () => {
    const { getByTestId } = renderTenant('/definitions/affordability/responses');

    expect(getByTestId('form-definition')).toBeTruthy();
  });

  it('should redirect unknown routes to the definitions list', () => {
    const { getByTestId } = renderTenant('/unknown');

    expect(getByTestId('form-definitions')).toBeTruthy();
  });

  it('should render the navigation menu in the app header', () => {
    const { getByTestId } = renderTenant('/definitions');

    expect(getByTestId('navigation-menu-menu')).toBeTruthy();
  });

  it('should render the navigation menu in the side panel', () => {
    const { getByTestId } = renderTenant('/definitions');

    expect(getByTestId('navigation-menu-side')).toBeTruthy();
  });

  it('should wrap routed content with the authorize user guard', () => {
    const { getByTestId } = renderTenant('/definitions');

    expect(getByTestId('authorize-user')).toBeTruthy();
  });

  it('should show the feedback notification', () => {
    const { getByTestId } = renderTenant('/definitions');

    expect(getByTestId('feedback-notification')).toBeTruthy();
  });
});
