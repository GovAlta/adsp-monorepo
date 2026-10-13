import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom-v7';
import { useDispatch, useSelector } from 'react-redux';
import { useScripts } from '@core-services/app-common';
import { TaskTenant } from './TaskTenant';
import { useFeedbackLinkHandler } from '../util/feedbackUtils';
import {
  configInitializedSelector,
  extensionsSelector,
  initializeTenant,
  tenantSelector,
  userSelector,
  feedbackSelector,
  loginUser,
  logoutUser,
} from '../state';

const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  useDispatch: jest.fn(),
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom-v7', () => ({
  ...jest.requireActual('react-router-dom-v7'),
  useParams: () => ({ tenant: 'autotest' }),
  useNavigate: () => mockNavigate,
}));

jest.mock('../state', () => ({
  configInitializedSelector: jest.fn(),
  extensionsSelector: jest.fn(),
  initializeTenant: jest.fn((name) => ({ type: 'tenant/initializeTenant', payload: name })),
  loadExtensions: jest.fn((id) => ({ type: 'config/loadExtensions', payload: id })),
  loginUser: jest.fn((payload) => ({ type: 'user/loginUser', payload })),
  logoutUser: jest.fn((payload) => ({ type: 'user/logoutUser', payload })),
  tenantSelector: jest.fn(),
  userSelector: jest.fn(),
  feedbackSelector: jest.fn(),
}));

jest.mock('./FeedbackNotification', () => ({
  FeedbackNotification: () => <div data-testid="feedback-notification" />,
}));

jest.mock('./AuthorizeUser', () => ({
  AuthorizeUser: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../util/feedbackUtils', () => ({
  useFeedbackLinkHandler: jest.fn(),
}));

jest.mock('@core-services/app-common', () => ({
  useScripts: jest.fn(),
}));

jest.mock('./TaskQueue', () => ({
  __esModule: true,
  default: () => <div data-testid="task-queue" />,
}));

jest.mock('./TaskQueues', () => ({
  __esModule: true,
  default: () => <div data-testid="task-queues" />,
}));

describe('TaskTenant', () => {
  const tenant = { id: 'tenant-1', name: 'autotest', realm: 'autotest' };
  let mockDispatch: jest.Mock;

  const setupSelectors = (
    overrides: {
      configInitialized?: boolean;
      user?: { initialized: boolean; user: { name: string } | null };
      feedback?: { message: string } | null;
    } = {},
  ) => {
    const configInitialized = overrides.configInitialized ?? true;
    const user = overrides.user ?? { initialized: true, user: null };
    const feedback = overrides.feedback ?? null;

    (useSelector as jest.Mock).mockImplementation((selector) => {
      if (selector === configInitializedSelector) return configInitialized;
      if (selector === tenantSelector) return tenant;
      if (selector === extensionsSelector) return [];
      if (selector === userSelector) return user;
      if (selector === feedbackSelector) return feedback;
      return undefined;
    });
  };

  beforeEach(() => {
    mockDispatch = jest.fn();
    (useDispatch as jest.Mock).mockReturnValue(mockDispatch);
    setupSelectors();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  const renderTenant = (initialEntry = '/') =>
    render(
      <MemoryRouter initialEntries={[initialEntry]}>
        <TaskTenant />
      </MemoryRouter>,
    );

  it('dispatches initializeTenant once config is initialized', async () => {
    // Arrange
    setupSelectors({ configInitialized: true });

    // Act
    renderTenant();
    await screen.findByTestId(/task-queues?/);

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(initializeTenant('autotest'));
  });

  it('navigates to overview when feedback reports the tenant was not found', async () => {
    // Arrange
    setupSelectors({ feedback: { message: 'Tenant not found' } });

    // Act
    renderTenant();
    await screen.findByTestId(/task-queues?/);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/overview');
  });

  it('registers the feedback link handler', async () => {
    // Arrange & Act
    renderTenant();
    await screen.findByTestId(/task-queues?/);

    // Assert
    expect(useFeedbackLinkHandler).toHaveBeenCalled();
  });

  it('loads extension scripts', async () => {
    // Arrange & Act
    renderTenant();
    await screen.findByTestId(/task-queues?/);

    // Assert
    expect(useScripts).toHaveBeenCalled();
  });

  it('shows a sign in button and dispatches loginUser when no user is signed in', async () => {
    // Arrange
    setupSelectors({ user: { initialized: true, user: null } });

    // Act
    renderTenant();
    await screen.findByTestId(/task-queues?/);
    fireEvent.click(screen.getByText('Sign in'));

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(loginUser({ tenant, from: '/' }));
  });

  it('shows a sign out button and dispatches logoutUser when a user is signed in', async () => {
    // Arrange
    setupSelectors({ user: { initialized: true, user: { name: 'Jane Doe' } } });

    // Act
    renderTenant();
    await screen.findByTestId(/task-queues?/);
    fireEvent.click(screen.getByText('Sign out'));

    // Assert
    expect(mockDispatch).toHaveBeenCalledWith(logoutUser({ tenant, from: '/?logout=true' }));
  });

  it('renders the queues list at the tenant root path', async () => {
    // Arrange & Act
    renderTenant('/');

    // Assert
    expect(await screen.findByTestId('task-queues')).toBeInTheDocument();
  });

  it('renders the task queue at the namespace and name path', async () => {
    // Arrange & Act
    renderTenant('/camps/intake');

    // Assert
    expect(await screen.findByTestId('task-queue')).toBeInTheDocument();
  });
});
