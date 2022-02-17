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
        contact: {
          contactEmail: 'jonathan.weyermandn@gov.ab.ca',
          phoneNumber: '7801234567',
          supportInstructions:
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
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
    },
    tenant: {
      realmRoles: ['uma_auth'],
    },
    subscription: {
      updateError: {},
    },
  };

  const invalidScore = JSON.parse(JSON.stringify(validStore));
  invalidScore.session.resourceAccess = {
    'urn:ads:platform:configuration-service': { roles: ['configuration-reader'] },
  };

  const store = mockStore(validStore);

  const invalidStore = mockStore(invalidScore);

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
    expect(phone.textContent).toContain('1 (780) 123-4567');
  });

  it('has a functioning edit button', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <ContactInformation />
      </Provider>
    );
    const editContactInfo = queryByTestId('edit-contact-info');
    expect(editContactInfo).not.toBeNull();
  });

  it('does not have functioning edit button', () => {
    const { queryByTestId } = render(
      <Provider store={invalidStore}>
        <ContactInformation />
      </Provider>
    );
    const editContactInfo = queryByTestId('edit-contact-info');
    expect(editContactInfo).toBeNull();
  });
});
