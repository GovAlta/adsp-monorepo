import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import { SignIn } from './SignIn';
import { authenticatedUserSelector, environmentSelector, loginUser, tenantSelector } from '../state';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/test-tenant', state: null }),
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
  const mockTenant = { id: 'test-tenant' };
  const mockEnvironment = { tenantName: 'test-tenant' };

  const setupSelectors = (authenticatedUser: unknown = null) => {
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === authenticatedUserSelector) return authenticatedUser;
      if (selector === environmentSelector) return mockEnvironment;
      if (selector === tenantSelector) return mockTenant;
      return undefined;
    });
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    setupSelectors();
  });

  test('renders the Band component with the correct title', () => {
    // Arrange & Act
    render(<SignIn url="https://example.com/test-tenant" />);

    // Assert
    expect(screen.getByText('Sandbox application')).toBeInTheDocument();
    expect(screen.getByText('Sign in to the sandbox')).toBeInTheDocument();
  });

  test('shows sign-in button when user is not authenticated, URL matches tenant, and no from state', () => {
    // Arrange — pathname ends with tenantName and no location.state.from
    setupSelectors(null);

    // Act
    render(<SignIn url="https://example.com/test-tenant" />);

    // Assert
    expect(screen.getByTestId('sandbox-sign-in')).toBeInTheDocument();
  });

  test('does not show sign-in button when user is authenticated', () => {
    // Arrange
    setupSelectors({ roles: ['admin'] });

    // Act
    render(<SignIn url="https://example.com/test-tenant" />);

    // Assert
    expect(screen.queryByTestId('sandbox-sign-in')).not.toBeInTheDocument();
  });

  test('shows not authorized message when user has no roles', () => {
    // Arrange
    setupSelectors({ roles: [] });

    // Act
    render(<SignIn url="https://example.com/test-tenant" />);

    // Assert
    expect(screen.getByText('Not authorized')).toBeInTheDocument();
    expect(screen.getByText('You do not have a permitted role to access this sandbox.')).toBeInTheDocument();
  });

  test('dispatches loginUser with /services suffix when URL does not end with /services', () => {
    // Arrange
    setupSelectors(null);
    render(<SignIn url="https://example.com/test-tenant" />);

    // Act
    fireEvent.click(screen.getByTestId('sandbox-sign-in'));

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(loginUser({ tenant: mockTenant, from: '/test-tenant/services' }));
  });

  test('dispatches loginUser with pathname when URL ends with /services', () => {
    // Arrange
    setupSelectors(null);
    render(<SignIn url="https://example.com/services" />);

    // Act
    fireEvent.click(screen.getByTestId('sandbox-sign-in'));

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(loginUser({ tenant: mockTenant, from: '/test-tenant' }));
  });
});
