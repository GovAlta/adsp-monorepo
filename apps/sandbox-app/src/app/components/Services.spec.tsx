import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import configureStore from 'redux-mock-store';
import Services from './Services';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockState = { user: null as unknown, initialized: true, authenticatedUser: null as unknown };
jest.mock('../state', () => ({
  userSelector: () => ({ user: mockState.user, initialized: mockState.initialized }),
  authenticatedUserSelector: () => mockState.authenticatedUser,
  environmentSelector: () => ({ tenantName: 'my-tenant' }),
}));
jest.mock('./Header', () => () => <div data-testid="header" />);
jest.mock('../hooks/useFeedbackWidget', () => ({ useFeedbackWidget: jest.fn() }));
jest.mock('../lib/loginReturn', () => ({
  buildLoginPath: (tenant: string, from: string) => `/${tenant}/login?from=${from}`,
}));
jest.mock('@core-services/app-common', () => ({ Band: ({ title }: { title: string }) => <div>{title}</div> }));

const renderServices = () =>
  render(
    <Provider store={configureStore()({})}>
      <MemoryRouter initialEntries={['/my-tenant']}>
        <Services />
      </MemoryRouter>
    </Provider>,
  );

describe('Services', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    Object.assign(mockState, { user: null, initialized: true, authenticatedUser: null });
  });

  it('redirects to login when there is no user', () => {
    renderServices();
    expect(mockNavigate).toHaveBeenCalledWith('/my-tenant/login?from=/my-tenant', { replace: true });
  });

  it('links each service under the current path', () => {
    mockState.user = { name: 'Tester' };
    mockState.authenticatedUser = { name: 'Tester' };
    renderServices();
    expect(mockNavigate).not.toHaveBeenCalled();
    expect(screen.getByText('Event service').closest('a')?.getAttribute('href')).toBe('/my-tenant/event');
  });

  it('shows the loading indicator until the user is authenticated', () => {
    const { container } = renderServices();
    expect(container.querySelector('goa-circular-progress')).toBeTruthy();
  });
});
