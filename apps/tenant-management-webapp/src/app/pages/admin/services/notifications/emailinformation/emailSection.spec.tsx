import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { EmailInformation } from './emailSection';

describe('EmailInformation', () => {
  const mockStore = configureStore([]);

  const storeWithRoles = (resourceAccess: Record<string, { roles: string[] }>) =>
    mockStore({
      notification: { email: { fromEmail: 'noreply@gov.ab.ca' } },
      session: { realm: 'core', resourceAccess },
    });

  const renderWithRoles = (resourceAccess: Record<string, { roles: string[] }>) =>
    render(
      <Provider store={storeWithRoles(resourceAccess)}>
        <EmailInformation />
      </Provider>
    );

  it('shows the edit button for subscription-admin', () => {
    const { queryByTestId } = renderWithRoles({
      'urn:ads:platform:notification-service': { roles: ['subscription-admin'] },
    });
    expect(queryByTestId('edit-email-info')).not.toBeNull();
  });

  it('shows the edit button for configuration-admin', () => {
    const { queryByTestId } = renderWithRoles({
      'urn:ads:platform:configuration-service': { roles: ['configuration-admin'] },
    });
    expect(queryByTestId('edit-email-info')).not.toBeNull();
  });

  it('disables the edit button without subscription-admin or configuration-admin', () => {
    const { queryByTestId } = renderWithRoles({
      'urn:ads:platform:configuration-service': { roles: ['configuration-reader'] },
    });
    expect(queryByTestId('edit-email-info')).toBeNull();
  });
});
