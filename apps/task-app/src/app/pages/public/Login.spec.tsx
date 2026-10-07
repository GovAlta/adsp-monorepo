import React from 'react';
import { render } from '@testing-library/react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom-v7';
import LoginLanding from './Login';
import { initializeTenant, loginUser, tenantSelector, feedbackSelector, configInitializedSelector } from '../../state';

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  useParams: jest.fn(),
  useNavigate: jest.fn(),
}));

jest.mock('../../state', () => ({
  initializeTenant: jest.fn((name) => ({ type: 'tenant/initializeTenant', payload: name })),
  loginUser: jest.fn((payload) => ({ type: 'user/loginUser', payload })),
  tenantSelector: jest.fn(),
  feedbackSelector: jest.fn(),
  configInitializedSelector: jest.fn(),
}));

describe('LoginLanding', () => {
  let mockDispatch: jest.Mock;
  let mockNavigate: jest.Mock;

  const setupSelectors = (
    overrides: {
      tenant?: { id: string; name: string; realm: string } | null;
      feedback?: { message: string } | null;
      configInitialized?: boolean;
    } = {},
  ) => {
    const tenant = overrides.tenant === undefined ? null : overrides.tenant;
    const feedback = overrides.feedback ?? null;
    const configInitialized = overrides.configInitialized ?? false;

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === tenantSelector) return tenant;
      if (selector === feedbackSelector) return feedback;
      if (selector === configInitializedSelector) return configInitialized;
      return undefined;
    });
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    mockNavigate = jest.fn();

    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useNavigate as jest.Mock).mockReturnValue(mockNavigate);
    (useParams as jest.Mock).mockReturnValue({ tenant: 'autotest' });

    setupSelectors();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('dispatches initializeTenant once config is initialized', () => {
    // Arrange
    setupSelectors({ configInitialized: true });

    // Act
    render(<LoginLanding />);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(initializeTenant('autotest'));
  });

  it('does not dispatch initializeTenant until config is initialized', () => {
    // Arrange
    setupSelectors({ configInitialized: false });

    // Act
    render(<LoginLanding />);

    // Assert
    expect(mockDispatch).not.toHaveBeenCalledWith(initializeTenant('autotest'));
  });

  it('dispatches loginUser with the tenant redirect path once the tenant is loaded', () => {
    // Arrange
    const tenant = { id: 'tenant-1', name: 'autotest', realm: 'autotest' };
    setupSelectors({ configInitialized: true, tenant });

    // Act
    render(<LoginLanding />);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(loginUser({ tenant, from: '/autotest' }));
  });

  it('navigates to overview when the tenant is not found', () => {
    // Arrange
    setupSelectors({ feedback: { message: 'Tenant not found' } });

    // Act
    render(<LoginLanding />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/overview');
  });

  it('does not navigate when feedback does not report a missing tenant', () => {
    // Arrange
    setupSelectors({ feedback: { message: 'Signed in successfully' } });

    // Act
    render(<LoginLanding />);

    // Assert
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});
