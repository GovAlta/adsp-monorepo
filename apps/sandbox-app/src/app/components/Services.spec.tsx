import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector } from 'react-redux';
import Services from './Services';
import { useFeedbackWidget } from '../hooks/useFeedbackWidget';
import { authenticatedUserSelector, environmentSelector, userSelector } from '../state';

const mockNavigate = jest.fn();

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ pathname: '/test-tenant/services' }),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }: { to: string; children: React.ReactNode }) => <a href={to}>{children}</a>,
}));

jest.mock('../hooks/useFeedbackWidget', () => ({
  useFeedbackWidget: jest.fn(),
}));

jest.mock('./Header', () => () => <div data-testid="header">Header</div>);

jest.mock('@abgov/react-components', () => ({
  GoabContainer: ({
    children,
    testId,
    heading,
  }: {
    children: React.ReactNode;
    testId: string;
    heading: React.ReactNode;
  }) => (
    <div data-testid={testId}>
      {heading}
      {children}
    </div>
  ),
  GoabCircularProgress: () => <div data-testid="goab-circular-progress" />,
  GoabAppFooter: () => <footer data-testid="goab-app-footer" />,
}));

jest.mock('@core-services/app-common', () => ({
  ...jest.requireActual('@core-services/app-common'),
  Band: () => null,
}));

const mockSelectors = (overrides: { user?: unknown; authenticatedUser?: unknown } = {}) => {
  const { user = { id: 'user-1' }, authenticatedUser = { id: 'user-1' } } = overrides;
  (useSelector as jest.Mock).mockImplementation((selector) => {
    if (selector === userSelector) return { user, initialized: true };
    if (selector === authenticatedUserSelector) return authenticatedUser;
    if (selector === environmentSelector) return { tenantName: 'test-tenant' };
    return undefined;
  });
};

describe('Services', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSelectors();
  });

  test('renders a card for the ADSP components library', () => {
    // Arrange & Act
    render(<Services />);

    // Assert
    expect(screen.getByTestId('AdspComponents')).toBeInTheDocument();
    expect(screen.getByText('ADSP components')).toBeInTheDocument();
  });

  test('links each service card to its route under the current path', () => {
    // Arrange & Act
    render(<Services />);

    // Assert
    expect(screen.getByText('ADSP components').closest('a')).toHaveAttribute(
      'href',
      '/test-tenant/services/adsp-components',
    );
  });

  test('sorts the service cards by name', () => {
    // Arrange & Act
    render(<Services />);

    // Assert
    const headings = screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent);
    expect(headings).toEqual([...headings].sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase())));
  });

  test('shows the loading indicator until the user is authenticated', () => {
    // Arrange
    mockSelectors({ authenticatedUser: null });

    // Act
    render(<Services />);

    // Assert
    expect(screen.getByTestId('goab-circular-progress')).toBeInTheDocument();
  });

  test('navigates to the landing page when there is no signed in user', () => {
    // Arrange
    mockSelectors({ user: null, authenticatedUser: null });

    // Act
    render(<Services />);

    // Assert
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  test('calls useFeedbackWidget with the tenant name', () => {
    // Arrange & Act
    render(<Services />);

    // Assert
    expect(useFeedbackWidget).toHaveBeenCalledWith('test-tenant');
  });
});
