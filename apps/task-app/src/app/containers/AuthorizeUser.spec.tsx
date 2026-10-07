import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams, useLocation } from 'react-router-dom-v7';
import { AuthorizeUser } from './AuthorizeUser';
import {
  userSelector,
  configInitializedSelector,
  tenantSelector,
  loginUser,
  feedbackSelector,
  busySelector,
} from '../state';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  useSearchParams: jest.fn(),
  useLocation: jest.fn(),
}));

jest.mock('../state', () => ({
  userSelector: jest.fn(),
  configInitializedSelector: jest.fn(),
  tenantSelector: jest.fn(),
  loginUser: jest.fn((payload) => ({ type: 'user/loginUser', payload })),
  feedbackSelector: jest.fn(),
  busySelector: jest.fn(),
}));

jest.mock('@abgov/react-components', () => ({
  GoabCallout: ({ heading, children }: { heading: string; children: React.ReactNode }) => (
    <div>
      <strong>{heading}</strong>
      <span>{children}</span>
    </div>
  ),
}));

jest.mock('../components/LoadingIndicator', () => ({
  LoadingIndicator: ({ isLoading }: { isLoading: boolean }) => (
    <div data-testid="loading-indicator" data-loading={isLoading} />
  ),
}));

describe('AuthorizeUser', () => {
  const tenant = { id: 'tenant-1', name: 'autotest', realm: 'autotest' };
  let mockDispatch: jest.Mock;

  const setupSelectors = (
    overrides: {
      user?: { initialized: boolean; user: { id: string; name: string; roles: string[] } | null };
      busy?: { initializing: boolean; loading: boolean };
      feedback?: { message: string } | null;
    } = {},
  ) => {
    const user = overrides.user ?? { initialized: false, user: null };
    const busy = overrides.busy ?? { initializing: true, loading: false };
    const feedback = overrides.feedback ?? null;

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === userSelector) return user;
      if (selector === tenantSelector) return tenant;
      if (selector === feedbackSelector) return feedback;
      if (selector === busySelector) return busy;
      return undefined;
    });
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSearchParams as jest.Mock).mockReturnValue([new URLSearchParams(''), jest.fn()]);
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/autotest/camps/intake' });
    setupSelectors();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('shows the loading indicator while the user is not yet initialized', () => {
    // Arrange
    setupSelectors({ user: { initialized: false, user: null } });

    // Act
    render(
      <AuthorizeUser>
        <div>Task queue content</div>
      </AuthorizeUser>,
    );

    // Assert
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument();
  });

  it('dispatches loginUser when initialized with no user and not logged out', () => {
    // Arrange
    setupSelectors({ user: { initialized: true, user: null } });

    // Act
    render(
      <AuthorizeUser>
        <div>Task queue content</div>
      </AuthorizeUser>,
    );

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(loginUser({ tenant, from: '/autotest/camps/intake' }));
  });

  it('renders children when the user is initialized and no roles are required', () => {
    // Arrange
    setupSelectors({ user: { initialized: true, user: { id: 'user-1', name: 'Jane Doe', roles: [] } } });

    // Act
    render(
      <AuthorizeUser>
        <div>Task queue content</div>
      </AuthorizeUser>,
    );

    // Assert
    expect(screen.getByText('Task queue content')).toBeInTheDocument();
  });

  it('renders children when the user has a required role', () => {
    // Arrange
    setupSelectors({
      user: { initialized: true, user: { id: 'user-1', name: 'Jane Doe', roles: ['task-worker'] } },
    });

    // Act
    render(
      <AuthorizeUser roles={['task-worker']}>
        <div>Task queue content</div>
      </AuthorizeUser>,
    );

    // Assert
    expect(screen.getByText('Task queue content')).toBeInTheDocument();
  });

  it('shows not authorized when the user lacks the required role', () => {
    // Arrange
    setupSelectors({
      user: { initialized: true, user: { id: 'user-1', name: 'Jane Doe', roles: ['task-reader'] } },
    });

    // Act
    render(
      <AuthorizeUser roles={['task-worker']}>
        <div>Task queue content</div>
      </AuthorizeUser>,
    );

    // Assert
    expect(screen.getByText('Not authorized')).toBeInTheDocument();
  });

  it('shows successfully signed out when the logout query parameter is set', () => {
    // Arrange
    (useSearchParams as jest.Mock).mockReturnValue([new URLSearchParams('logout=true'), jest.fn()]);
    setupSelectors({ user: { initialized: true, user: null } });

    // Act
    render(
      <AuthorizeUser>
        <div>Task queue content</div>
      </AuthorizeUser>,
    );

    // Assert
    expect(screen.getByText('Successfully signed out')).toBeInTheDocument();
  });

  it('shows login failed when feedback reports an error', () => {
    // Arrange
    setupSelectors({
      user: { initialized: true, user: null },
      feedback: { message: 'Error encountered during login' },
    });

    // Act
    render(
      <AuthorizeUser>
        <div>Task queue content</div>
      </AuthorizeUser>,
    );

    // Assert
    expect(screen.getByText('Login failed')).toBeInTheDocument();
  });

  it('does not dispatch loginUser when the user already logged out', () => {
    // Arrange
    (useSearchParams as jest.Mock).mockReturnValue([new URLSearchParams('logout=true'), jest.fn()]);
    setupSelectors({ user: { initialized: true, user: null } });

    // Act
    render(
      <AuthorizeUser>
        <div>Task queue content</div>
      </AuthorizeUser>,
    );

    // Assert
    expect(mockDispatch).not.toHaveBeenCalled();
  });
});
