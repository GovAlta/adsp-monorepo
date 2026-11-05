import React from 'react';
import { act, fireEvent, render } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { configReducer } from './store/config/slice';
import { notificationsReducer } from './store/notifications/reducer';
import { ErrorNotification } from './store/notifications/actions';
import { SessionState, sessionReducer } from './store/session/slice';
import { getKeycloakClient } from './store/session/keycloak';
import { AppContent } from './app';

jest.mock('./store/session/keycloak', () => ({ getKeycloakClient: jest.fn(), createKeycloakClient: jest.fn() }));
jest.mock('./planner', () => ({ ProjectPlannerRouter: () => <div data-testid="planner" /> }));

describe('AppContent', () => {
  const client = { login: jest.fn(), logout: jest.fn() };
  const plannerRoles = (roles: string[]) => ({ 'urn:ads:platform:project-planner-service': { roles } });

  const renderWith = (session: SessionState) => {
    const store = configureStore({
      reducer: { config: configReducer, session: sessionReducer, notifications: notificationsReducer },
      preloadedState: {
        config: { initialized: true, environment: {}, serviceUrls: {} },
        session,
        notifications: { notifications: [] },
      },
    });
    const view = render(
      <Provider store={store}>
        <MemoryRouter>
          <AppContent />
        </MemoryRouter>
      </Provider>,
    );
    return { ...view, store };
  };

  const signedIn = (roles: string[]): SessionState => ({
    initialized: true,
    authenticated: true,
    userInfo: { name: 'Pat Planner', email: 'pat@example.com' },
    resourceAccess: plannerRoles(roles),
  });

  beforeEach(() => {
    (getKeycloakClient as jest.Mock).mockReturnValue(client);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('shows a loading indicator until the session is checked', () => {
    const { container } = renderWith({ initialized: false, authenticated: false });

    expect(container.querySelector('goa-circular-progress')).not.toBeNull();
  });

  it('scrolls the page in its own container, since the global styles stop the document scrolling', () => {
    renderWith(signedIn(['planner-user']));

    const scrollContainer = document.getElementById('app-scroll-container');
    expect(scrollContainer).not.toBeNull();
    expect(getComputedStyle(scrollContainer as Element).overflow).toBe('auto');
  });

  it('offers sign-in through GoA SSO when nobody is signed in', () => {
    const { container } = renderWith({ initialized: true, authenticated: false });

    fireEvent(container.querySelector('goa-button[testid="sign-in"]') as Element, new CustomEvent('_click'));

    expect(client.login).toHaveBeenCalledWith(expect.objectContaining({ idpHint: 'core' }));
  });

  it('shows the planner to planner users', () => {
    const { getByTestId } = renderWith(signedIn(['planner-user']));

    expect(getByTestId('planner')).toBeTruthy();
  });

  it('tells signed-in users without a planner role that they have no access', () => {
    const { getByText, queryByTestId } = renderWith(signedIn(['other-role']));

    expect(getByText("You don't have access to the project planner.")).toBeTruthy();
    expect(queryByTestId('planner')).toBeNull();
  });

  it('lets signed-in users sign out', () => {
    const { container } = renderWith(signedIn(['planner-user']));

    fireEvent(container.querySelector('goa-button[testid="sign-out"]') as Element, new CustomEvent('_click'));

    expect(client.logout).toHaveBeenCalled();
  });

  it('shows notifications and lets the user dismiss them', () => {
    const { container, store } = renderWith(signedIn(['planner-user']));
    act(() => {
      store.dispatch(ErrorNotification({ message: 'Could not load solutions.' }));
    });

    const notification = container.querySelector('goa-notification') as Element;
    fireEvent(notification, new CustomEvent('_dismiss'));

    expect(store.getState().notifications.notifications).toEqual([]);
  });
});
