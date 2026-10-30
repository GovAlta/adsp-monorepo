import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { getAccessScope } from '@store/agent/actions';
import { AccessScope } from '@store/agent/model';
import { AccessScopeBanner } from './AccessScopeBanner';

jest.mock('@store/agent/actions', () => ({
  getAccessScope: jest.fn(),
}));

const mockGetAccessScope = getAccessScope as jest.Mock;
const mockStore = configureStore([thunk]);

function renderBanner() {
  return render(
    <Provider store={mockStore({})}>
      <AccessScopeBanner />
    </Provider>,
  );
}

describe('AccessScopeBanner', () => {
  beforeEach(() => {
    mockGetAccessScope.mockReset();
  });

  it('shows a loading state until the scope is known', () => {
    mockGetAccessScope.mockReturnValue(() => new Promise(() => undefined));

    const { getByTestId } = renderBanner();

    expect(getByTestId('access-scope-banner')).toHaveAttribute('data-status', 'loading');
    expect(getByTestId('access-scope-banner')).toHaveTextContent('Checking what you can inspect…');
  });

  it('shows the environment, Keycloak host and realm the user can inspect, read-only', async () => {
    const scope: AccessScope = {
      status: 'available',
      message: 'You can inspect the realm-1 realm in Development (read-only).',
      environment: { id: 'dev', label: 'Development', host: 'https://access.adsp-dev.gov.ab.ca', readOnly: true },
      realm: { id: 'realm-1', kind: 'tenant' },
      readOnly: true,
    };
    mockGetAccessScope.mockReturnValue(() => Promise.resolve(scope));

    const { getByTestId } = renderBanner();

    await waitFor(() => expect(getByTestId('access-scope-banner')).toHaveAttribute('data-status', 'available'));
    expect(getByTestId('access-scope-banner')).toHaveTextContent('Your scope');
    expect(getByTestId('access-scope-environment')).toHaveTextContent('Development');
    expect(getByTestId('access-scope-host')).toHaveTextContent('https://access.adsp-dev.gov.ab.ca');
    expect(getByTestId('access-scope-realm')).toHaveTextContent('realm-1');
    expect(getByTestId('access-scope-realm-kind')).toHaveTextContent('Tenant');
    expect(getByTestId('access-scope-banner').querySelector('goa-badge')).toHaveAttribute('content', 'Read-only');
  });

  it('labels the core realm for core users', async () => {
    mockGetAccessScope.mockReturnValue(() =>
      Promise.resolve({
        status: 'available',
        message: '',
        environment: { id: 'dev', label: 'Development', host: 'https://access.adsp-dev.gov.ab.ca', readOnly: true },
        realm: { id: 'core', kind: 'core' },
        readOnly: true,
      }),
    );

    const { getByTestId } = renderBanner();

    await waitFor(() => expect(getByTestId('access-scope-realm')).toHaveTextContent('core'));
    expect(getByTestId('access-scope-realm-kind')).toHaveTextContent('Core');
  });

  it('explains a missing role instead of showing an error', async () => {
    mockGetAccessScope.mockReturnValue(() =>
      Promise.resolve({
        status: 'unavailable',
        reason: 'MISSING_ROLE',
        missingRoles: ['urn:ads:platform:agent-service:agent-user'],
        message: 'You do not have the role needed to inspect the Access Service.',
      }),
    );

    const { getByTestId } = renderBanner();

    await waitFor(() => expect(getByTestId('access-scope-banner')).toHaveAttribute('data-status', 'unavailable'));
    const banner = getByTestId('access-scope-banner');
    expect(banner).toHaveAttribute('data-reason', 'MISSING_ROLE');
    expect(banner).toHaveTextContent('You do not have the role needed to inspect the Access Service.');
    expect(banner).toHaveTextContent('Missing role: urn:ads:platform:agent-service:agent-user');
  });

  it('shows a notice when the scope cannot be loaded', async () => {
    mockGetAccessScope.mockReturnValue(() => Promise.reject(new Error('Network Error')));

    const { getByTestId } = renderBanner();

    await waitFor(() => expect(getByTestId('access-scope-banner')).toHaveAttribute('data-status', 'error'));
    expect(getByTestId('access-scope-banner')).toHaveTextContent(
      'Live inspection may not work right now. The assistant can still answer general questions.',
    );
  });
});
