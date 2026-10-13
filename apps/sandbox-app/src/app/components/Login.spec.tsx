import React from 'react';
import { render, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate, useParams } from 'react-router-dom-v7';
import { Login } from './Login';
import {
  initializeConfig,
  loginUserWithIDP,
  configInitializedSelector,
  directorySelector,
  environmentSelector,
} from '../state';
import { getRealm } from '../lib/keycloak';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  useLocation: jest.fn(),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../state', () => ({
  initializeConfig: jest.fn(),
  loginUserWithIDP: jest.fn(),
  configInitializedSelector: jest.fn(),
  directorySelector: jest.fn(),
  environmentSelector: jest.fn(),
}));

jest.mock('../lib/keycloak', () => ({
  getRealm: jest.fn(),
}));

describe('Login Component', () => {
  let mockDispatch;
  let mockNavigate;

  const defaultEnv = { tenantName: 'test-tenant' };
  const defaultDirectory = { 'urn:ads:platform:tenant-service': 'http://tenant-service' };

  const setupSelectors = (overrides: { env?: object; directory?: object; configInitialized?: boolean } = {}) => {
    const env = overrides.env ?? defaultEnv;
    const directory = overrides.directory ?? defaultDirectory;
    const configInitialized = overrides.configInitialized ?? false;
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === environmentSelector) return env;
      if (selector === directorySelector) return directory;
      if (selector === configInitializedSelector) return configInitialized;
      return undefined;
    });
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockNavigate = jest.fn();

    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ tenant: 'test-tenant' });
    (useLocation as jest.Mock).mockReturnValue({ pathname: '/test-tenant/services' });

    setupSelectors();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('dispatches initializeConfig if config is not initialized', () => {
    // Arrange
    setupSelectors({ configInitialized: false });

    // Act
    render(<Login />);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(initializeConfig());
  });

  test('navigates to root if tenant name does not match environment tenantName', () => {
    // Arrange
    setupSelectors({ env: { tenantName: 'different-tenant' } });

    // Act
    render(<Login />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('calls tenantLogin if realm and environment conditions are met', async () => {
    // Arrange
    const mockGetRealm = getRealm as jest.Mock;
    mockGetRealm.mockResolvedValue('updated-realm');

    // Act
    render(<Login />);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(
      loginUserWithIDP({
        idpFromUrl: 'core',
        realm: 'updated-realm',
        from: `${window.location.origin}/test-tenant/services`,
      }),
    );
  });

  test('navigates to realm path if updatedRealm is null', async () => {
    // Arrange
    const mockGetRealm = getRealm as jest.Mock;
    mockGetRealm.mockResolvedValue(null);

    // Act
    await act(async () => {
      render(<Login />);
    });

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/test-tenant');
  });

  test('does not dispatch initializeConfig if already initialized', () => {
    // Arrange
    setupSelectors({ configInitialized: true });

    // Act
    render(<Login />);

    // Assert
    expect(mockDispatch).not.toHaveBeenCalledWith(initializeConfig());
  });

  test('sends the user back to the page they were trying to open after login', async () => {
    // Arrange
    (getRealm as jest.Mock).mockResolvedValue('updated-realm');
    (useLocation as jest.Mock).mockReturnValue({
      pathname: '/test-tenant/login',
      search: `?returnTo=${encodeURIComponent('/test-tenant/services/planning-poker/8b0f6a52')}`,
    });

    // Act
    await act(async () => {
      render(<Login />);
    });

    // Assert
    expect(loginUserWithIDP).toHaveBeenCalledWith({
      idpFromUrl: 'core',
      realm: 'updated-realm',
      from: `${window.location.origin}/test-tenant/services/planning-poker/8b0f6a52`,
    });
  });

  test('ignores a return page outside the tenant', async () => {
    // Arrange
    (getRealm as jest.Mock).mockResolvedValue('updated-realm');
    (useLocation as jest.Mock).mockReturnValue({
      pathname: '/test-tenant/login',
      search: `?returnTo=${encodeURIComponent('https://evil.example.com')}`,
    });

    // Act
    await act(async () => {
      render(<Login />);
    });

    // Assert
    expect(loginUserWithIDP).toHaveBeenCalledWith(
      expect.objectContaining({ from: `${window.location.origin}/test-tenant/services` }),
    );
  });
});
