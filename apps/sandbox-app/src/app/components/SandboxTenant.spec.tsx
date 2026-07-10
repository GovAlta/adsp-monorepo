import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SandBoxTenant } from './SandboxTenant';
import { useSelector, useDispatch } from 'react-redux';
import { useFeedbackWidget } from '../hooks/useFeedbackWidget';
import { authenticatedUserSelector, configInitializedSelector, environmentSelector, initializeTenant } from '../state';

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ tenant: 'test-tenant' }),
  useLocation: () => ({ pathname: '/test-tenant' }),
  useNavigate: () => jest.fn(),
  Navigate: () => null,
  Routes: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  Route: ({ element }: { element: React.ReactNode }) => <>{element}</>,
}));

jest.mock('../hooks/useFeedbackWidget', () => ({
  useFeedbackWidget: jest.fn(),
}));

jest.mock('../state', () => ({
  ...jest.requireActual('../state'),
  initializeTenant: jest.fn((name) => ({ type: 'initializeTenant', payload: name })),
}));

jest.mock('./Header', () => () => <div data-testid="header">Header</div>);
jest.mock('./FeedbackNotification', () => ({
  FeedbackNotification: () => <div data-testid="feedback-notification">FeedbackNotification</div>,
}));
jest.mock('./SignIn', () => ({ SignIn: () => <div data-testid="sign-in">SignIn</div> }));
jest.mock('@abgov/react-components', () => ({
  GoabButton: ({ children, onClick }: { children: React.ReactNode; onClick: () => void }) => (
    <button data-testid="goab-button" onClick={onClick}>
      {children}
    </button>
  ),
  GoabButtonGroup: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="goab-button-group">{children}</div>
  ),
  GoabAppFooter: () => <footer data-testid="goab-app-footer" />,
  GoabCircularProgress: () => <div data-testid="goab-circular-progress" />,
}));

// Mock all service sub-components to keep the test focused on SandBoxTenant
jest.mock('./services/FormServiceMain', () => ({ FormServiceMain: () => null }));
jest.mock('./services/AgentServiceMain', () => ({ AgentServiceMain: () => null }));
jest.mock('./services/FeedbackServiceMain', () => ({ FeedbackServiceMain: () => null }));
jest.mock('./services/NotificationServiceMain', () => ({ NotificationServiceMain: () => null }));
jest.mock('./services/PDFServiceMain', () => ({ PDFServiceMain: () => null }));
jest.mock('./services/JsonformsMain', () => ({ JsonformsMain: () => null }));
jest.mock('./services/StatusServiceMain', () => ({ StatusServiceMain: () => null }));
jest.mock('./services/ValueServiceMain', () => ({ ValueServiceMain: () => null }));
jest.mock('./services/TaskServiceMain', () => ({ TaskServiceMain: () => null }));
jest.mock('./services/FileServiceMain', () => ({ FileServiceMain: () => null }));
jest.mock('./services/ScriptServiceMain', () => ({ ScriptServiceMain: () => null }));
jest.mock('./services/CacheServiceMain', () => ({ CacheServiceMain: () => null }));
jest.mock('./services/DirectoryServiceMain', () => ({ DirectoryServiceMain: () => null }));
jest.mock('./services/CalendarServiceMain', () => ({ CalendarServiceMain: () => null }));
jest.mock('./services/SharepointServiceMain', () => ({ SharepointServiceMain: () => null }));
jest.mock('./services/EventServiceMain', () => ({ EventServiceMain: () => null }));
jest.mock('./services/ConfigurationServiceMain', () => ({ ConfigurationServiceMain: () => null }));
jest.mock('./services/feedback/FeedbackCSSLeak', () => ({ FeedbackCSSLeak: () => null }));
jest.mock('./services/jsonforms/JsonformsExampleOne', () => ({ JsonformsExampleOne: () => null }));
jest.mock('./services/DesignSystemsMain', () => ({ DesignSystemsMain: () => null }));
jest.mock('./services/design-systems/DesignSystemsExampleOne', () => ({ DesignSystemsExampleOne: () => null }));
jest.mock('@core-services/app-common', () => ({ Band: () => null }));

describe('SandBoxTenant', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === authenticatedUserSelector) return null;
      if (selector === configInitializedSelector) return true;
      if (selector === environmentSelector) return { tenantName: 'test-tenant' };
      return undefined;
    });
  });

  test('renders Header and FeedbackNotification components', () => {
    // Arrange & Act
    render(<SandBoxTenant />);

    // Assert
    expect(screen.getByTestId('header')).toBeInTheDocument();
    expect(screen.getByTestId('feedback-notification')).toBeInTheDocument();
  });

  test('renders SignIn component when authenticatedUser is null', () => {
    // Arrange & Act
    render(<SandBoxTenant />);

    // Assert
    expect(screen.getByTestId('sign-in')).toBeInTheDocument();
  });

  test('dispatches initializeTenant when configInitialized is true', () => {
    // Arrange & Act
    render(<SandBoxTenant />);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(initializeTenant('test-tenant'));
  });

  test('calls useFeedbackWidget with tenant name', () => {
    // Arrange & Act
    render(<SandBoxTenant />);

    // Assert
    expect(useFeedbackWidget).toHaveBeenCalledWith('test-tenant');
  });
});
