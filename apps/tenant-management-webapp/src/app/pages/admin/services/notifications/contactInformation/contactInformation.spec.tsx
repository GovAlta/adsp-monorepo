import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ContactInformation } from './index';

describe('NotificationTypes Page', () => {
  const mockStore = configureStore([]);

  const validStore = {
    notification: {
      supportContact: {
        contactEmail: 'jonathan.weyermandn@gov.ab.ca',
        phoneNumber: '7801234567',
        supportInstructions:
          'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      },
      notificationTypes: {
        notificationId: {
          name: 'Child care subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          events: [
            {
              namespace: 'file-service',
              name: 'file-uploaded',
              templates: {
                email: {
                  subject: 'dfds',
                  body: 'sdfsdf',
                },
              },
              channels: [],
            },
          ],
          subscriberRoles: [],
          id: 'notificationId',
          publicSubscribe: false,
        },
        anotherNotificationId: {
          name: 'Some other subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          events: [{ namespace: 'file-service', name: 'file-deleted', templates: {}, channels: [] }],
          subscriberRoles: [],
          id: 'anotherNotificationId',
          publicSubscribe: false,
        },
      },
      core: {
        superCoreNotificationStuff: {
          name: 'Some other subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          events: [{ namespace: 'file-service', name: 'file-deleted', templates: {}, channels: [] }],
          subscriberRoles: [],
          id: 'superCoreNotificationStuff',
          publicSubscribe: false,
        },
      },
    },
    event: {
      definitions: {
        'foo:bar': {
          namespace: 'foo',
          name: 'bar',
          description: 'foobar',
          isCore: false,
          payloadSchema: {},
        },
      },
    },
    user: { jwt: { token: '' } },
    session: {
      realm: 'core',
      resourceAccess: { 'urn:ads:platform:configuration-service': { roles: ['configuration-admin'] } },
      loadingStates: [{ name: 'tenant/notification-service/notificationConfig/fetch', state: 'completed' }],
    },
    tenant: {
      realmRoles: ['uma_auth'],
    },
    subscription: {
      updateError: {},
    },
  };

  const storeWithRoles = (resourceAccess: Record<string, { roles: string[] }>) =>
    mockStore({ ...validStore, session: { ...validStore.session, resourceAccess } });

  const store = mockStore(validStore);

  it('renders contact info', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <ContactInformation />
      </Provider>
    );
    const email = queryByTestId('email');
    const supportInstructions = queryByTestId('support-instructions');
    const phone = queryByTestId('phone');
    expect(email.textContent).toContain('jonathan.weyermandn@gov.ab.ca');
    expect(supportInstructions.textContent).toContain('Lorem ipsum dolor');
    expect(phone.textContent).toContain('Phone number780 123 4567');
  });

  it('shows the edit button for configuration-admin', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <ContactInformation />
      </Provider>
    );
    expect(queryByTestId('edit-contact-info')).not.toBeNull();
  });

  it('shows the edit button for subscription-admin', () => {
    const { queryByTestId } = render(
      <Provider store={storeWithRoles({ 'urn:ads:platform:notification-service': { roles: ['subscription-admin'] } })}>
        <ContactInformation />
      </Provider>
    );
    expect(queryByTestId('edit-contact-info')).not.toBeNull();
  });

  it('disables the edit button without subscription-admin or configuration-admin', () => {
    const { queryByTestId } = render(
      <Provider
        store={storeWithRoles({
          'urn:ads:platform:configuration-service': { roles: ['configuration-reader'] },
          'urn:ads:platform:notification-service': { roles: ['subscription-app'] },
        })}
      >
        <ContactInformation />
      </Provider>
    );
    expect(queryByTestId('edit-contact-info')).toBeNull();
  });
});
