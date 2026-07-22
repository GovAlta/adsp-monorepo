import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import { SignIn } from './SignIn';
import { authenticatedUserSelector, environmentSelector, loginUser, tenantSelector } from '../state';
import { useLocation, useNavigate } from 'react-router-dom';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
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
});
