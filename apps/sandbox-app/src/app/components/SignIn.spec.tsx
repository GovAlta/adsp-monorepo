import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import { SignIn } from './SignIn';
import {
  authenticatedUserSelector,
  environmentSelector,
  hasKeycloakSession,
  loginUser,
  tenantSelector,
  userInitializedSelector,
} from '../state';
import { useLocation, useNavigate } from 'react-router-dom';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  useLocation: jest.fn(() => ({ pathname: '/test-tenant', state: null })),
  useNavigate: jest.fn(),
}));

jest.mock('./styled-components', () => ({
  CenteredProgress: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="centered-progress">{children}</div>
  ),
}));

jest.mock('../state', () => ({
  ...jest.requireActual('../state'),
  loginUser: jest.fn((args) => ({ type: 'loginUser', payload: args })),
  hasKeycloakSession: jest.fn(() => false),
}));

jest.mock('@core-services/app-common', () => ({
  Band: ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div>
      <h1>{title}</h1>
      <p>{children}</p>
    </div>
  ),
  Container: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Grid: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GridItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

jest.mock('@abgov/react-components', () => ({
  GoabButton: ({
    children,
    onClick,
    ...rest
  }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode }) => (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  ),
  GoabButtonGroup: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  GoabCallout: ({ heading, children }: { heading: string; children: React.ReactNode }) => (
    <div>
      <strong>{heading}</strong>
      <span>{children}</span>
    </div>
  ),
  GoabCircularProgress: ({ message }: { message: string }) => <div data-testid="circular-progress">{message}</div>,
}));

describe('SignIn Component', () => {
  const mockDispatch = jest.fn();
  const mockNavigate = jest.fn();
  const mockTenant = { id: 'test-tenant' };
  const mockEnvironment = { tenantName: 'test-tenant' };

  beforeEach(() => {
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const setupSelectors = (authenticatedUser: unknown = null) => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === authenticatedUserSelector) return authenticatedUser;
      if (selector === environmentSelector) return mockEnvironment;
      if (selector === tenantSelector) return mockTenant;
      return null;
    });
  };

  test('renders the Band component with correct title', () => {
    // Arrange
    setupSelectors();

    // Act
    render(<SignIn url="/test-url" />);

    // Assert
    expect(screen.getByText('Sandbox application')).toBeInTheDocument();
  });

  test('redirects to root if tenant name is not in the path', () => {
    // Arrange
    setupSelectors();
    (useNavigate as jest.Mock).mockClear();
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === environmentSelector) return { tenantName: 'another-tenant' };
      if (selector === tenantSelector) return mockTenant;
      return null;
    });

    // Act
    render(<SignIn url="/test-url" />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/', { state: { from: undefined } });
  });

  test('dispatches loginUser action if user is not authenticated and `from` is defined', () => {
    // Arrange
    (useLocation as jest.Mock).mockReturnValueOnce({ pathname: '/test-tenant', state: { from: '/dashboard' } });
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === authenticatedUserSelector) return null;
      if (selector === environmentSelector) return mockEnvironment;
      if (selector === tenantSelector) return mockTenant;
      return null;
    });

    // Act
    render(<SignIn url="/test-url" />);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(loginUser({ tenant: mockTenant, from: '/dashboard' }));
  });

  test('shows not authorized message if authenticated user has no roles', () => {
    // Arrange
    setupSelectors({ roles: [] });

    // Act
    render(<SignIn url="/test-url" />);

    // Assert
    expect(screen.getByText('Not authorized')).toBeInTheDocument();
    expect(screen.getByText('You do not have a permitted role to access this sandbox.')).toBeInTheDocument();
  });

  test('does not show not authorized message if authenticated user has roles', () => {
    // Arrange
    setupSelectors({ roles: ['admin'] });

    // Act
    render(<SignIn url="/test-url" />);

    // Assert
    expect(screen.queryByText('Not authorized')).not.toBeInTheDocument();
  });

  describe('signed out on a services page', () => {
    const servicePage = { pathname: '/test-tenant/services/planning-poker/8b0f6a52', search: '?tab=2', state: null };

    const setupSignedOut = (userInitialized: boolean) => {
      (useLocation as jest.Mock).mockReturnValue(servicePage);
      (useSelector as jest.Mock).mockImplementation((selector) => {
        if (selector === userInitializedSelector) return userInitialized;
        if (selector === environmentSelector) return mockEnvironment;
        if (selector === tenantSelector) return mockTenant;
        return null;
      });
    };

    afterEach(() => {
      (useLocation as jest.Mock).mockReturnValue({ pathname: '/test-tenant', state: null });
    });

    test('goes to login and asks to come back to the same page', () => {
      // Arrange
      setupSignedOut(true);

      // Act
      render(<SignIn url="/test-url" />);

      // Assert
      expect(mockNavigate).toHaveBeenCalledWith(
        `/test-tenant/login?returnTo=${encodeURIComponent('/test-tenant/services/planning-poker/8b0f6a52?tab=2')}`,
        { replace: true },
      );
    });

    test('waits until the sign-in check has finished', () => {
      // Arrange
      setupSignedOut(false);

      // Act
      render(<SignIn url="/test-url" />);

      // Assert
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('does not loop through login when a service rejected a still-valid session', () => {
      // Arrange
      setupSignedOut(true);
      (hasKeycloakSession as jest.Mock).mockReturnValueOnce(true);

      // Act
      render(<SignIn url="/test-url" />);

      // Assert
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
});
