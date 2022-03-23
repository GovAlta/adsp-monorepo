import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ContactInformation } from './contactInformation';

describe('NotificationTypes Page', () => {
  const mockStore = configureStore([]);

  const validStore = {
    serviceStatus: {
      contact: {
        contactEmail: 'jonathan.weyermandn@gov.ab.ca',
      },
    },
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
    expect(email.textContent).toContain('jonathan.weyermandn@gov.ab.ca');
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
