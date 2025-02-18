import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { NotificationTypes } from './notificationTypes';
import { DELETE_NOTIFICATION_TYPE, UPDATE_NOTIFICATION_TYPE } from '@store/notification/actions';

describe('NotificationTypes Page', () => {
  const mockStore = configureStore([]);

  const store = mockStore({
    notification: {
      notificationTypes: {
        notificationId: {
          name: 'Child care subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          channels: ['email', 'bot'],
          sortedChannels: ['email', 'bot'],
          events: [
            {
              namespace: 'file-service',
              name: 'file-uploaded',
              templates: {
                email: {
                  subject: 'hi',
                  title: 'title loaded',
                  subtitle: 'subtitle',
                  body: 'this is a triumph',
                },
                bot: {
                  subject: 'hello',
                  body: 'huge success',
                },
              },
            },
          ],
          subscriberRoles: [],
          id: 'notificationId',
          publicSubscribe: false,
        },
        anotherNotificationId: {
          name: 'Some other subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          channels: ['email', 'bot'],
          sortedChannels: ['email', 'bot'],
          events: [
            {
              namespace: 'file-service',
              name: 'file-deleted',
              templates: {
                email: {
                  subject: 'diggles',
                  title: 'title2',
                  subtitle: 'subtitle2',
                  body: 'Lorem ipsum dolorLorem ipsum dolorLorem ipsum dolorLorem ipsum dolor',
                },
                bot: {
                  subject: '',
                  body: '',
                },
              },
            },
          ],
          subscriberRoles: [],
          id: 'anotherNotificationId',
          publicSubscribe: false,
          manageSubscribe: true,
        },
      },
      core: {
        superCoreNotificationStuff: {
          name: 'Some other subsidy application',
          description: 'Lorem ipsum dolor sit amet',
          events: [
            {
              namespace: 'file-service',
              name: 'file-deleted',
              templates: {
                email: { subject: 'sdd', body: 'sds', title: 'title3', subtitle: 'subtitle3' },
              },
            },
          ],
          subscriberRoles: [],
          channels: ['email'],
          sortedChannels: ['email'],
          id: 'superCoreNotificationStuff',
          publicSubscribe: false,
          manageSubscribe: true,
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
      loadingStates: [{ name: 'tenant/notification-service/notificationConfig/fetch', state: 'completed' }],
    },
    tenant: {
      realmRoles: [
        {
          id: '5ef67c57',
          name: 'uma_authorization',
          description: 'role_uma_authorization',
          composite: false,
          clientRole: false,
          containerId: '4cc89eed',
        },
        {
          id: 'c85d9bdd',
          name: 'offline_access',
          description: 'role_offline-access',
          composite: false,
          clientRole: false,
          containerId: '4cc89eed',
        },
      ],
    },
    config: {
      serviceUrls: {
        subscriberWebApp: 'https://subscription',
      },
    },
  });

  it('renders', () => {
    const { baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const addDefButton = baseElement.querySelector("goa-button[testId='add-notification']");
    expect(addDefButton).not.toBeNull();
  });

  it('allows for the NotificationTypes to be added', async () => {
    const { queryByTestId, baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const addDefButton = baseElement.querySelector("goa-button[testId='add-notification']");
    fireEvent.click(addDefButton);
    const dialog = baseElement.querySelector("goa-modal[testId='notification-types-form']");
    await waitFor(() => {
      expect(dialog).not.toBeNull();
    });
  });

  it('deletes a notification type', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );

    const deleteBtn = baseElement.querySelectorAll("goa-icon-button[testId='delete-notification-type']")[0];
    fireEvent(deleteBtn, new CustomEvent('_click'));
    const confirmation = baseElement.querySelector('goa-modal');
    const actionContent = confirmation.querySelector("[slot='actions']");
    const deleteConfirm = actionContent.querySelector("[testid='delete-confirm']");
    expect(confirmation).not.toBeNull();

    fireEvent(deleteConfirm, new CustomEvent('_click'));
    const actions = store.getActions();

    const deleteAction = actions.find((action) => action.type === DELETE_NOTIFICATION_TYPE);
    expect(deleteAction).toBeTruthy();
  });

  it('cancels deleting a notification type', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );

    const deleteBtn = baseElement.querySelectorAll("goa-icon-button[testId='delete-notification-type']")[0];
    fireEvent(deleteBtn, new CustomEvent('_click'));
    const confirmation = baseElement.querySelector('goa-modal');
    const actionContent = confirmation.querySelector("[slot='actions']");
    await waitFor(() => {
      expect(actionContent.querySelector("[testid='delete-cancel']")).toBeVisible();
    });
  });

  it('edits the notification types', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const editBtn = baseElement.querySelectorAll("goa-icon-button[testId='edit-notification-type']")[0];
    await waitFor(() => {
      fireEvent.click(editBtn);
    });

    // fields
    const name = baseElement.querySelector("goa-input[testId='form-name']");
    const description = baseElement.querySelector("goa-textarea[testId='form-description']");
    const cancelBtn = baseElement.querySelector("goa-button[testId='form-cancel']");
    const saveBtn = baseElement.querySelector("goa-button[testId='form-save']");

    expect(name).not.toBeNull();
    expect(description).not.toBeNull();
    expect(cancelBtn).not.toBeNull();
    expect(saveBtn).not.toBeNull();
    // fill
    fireEvent(
      description,
      new CustomEvent('_change', {
        detail: { value: 'the updated description' },
      })
    );
    fireEvent(
      name,
      new CustomEvent('_change', {
        detail: { value: 'the updated name' },
      })
    );

    fireEvent(saveBtn, new CustomEvent('_click'));
    const actions = store.getActions();

    const saveAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);

    expect(saveAction).toBeTruthy();
  });

  it('cancels editing the notification type', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );

    await waitFor(() => {
      const editBtn = baseElement.querySelectorAll("goa-icon-button[testId='edit-notification-type']")[0];
      fireEvent.click(editBtn);
    });

    const cancelButton = baseElement.querySelector("goa-button[testId='form-cancel']");
    fireEvent.click(cancelButton);

    await waitFor(() => {
      const form = baseElement.querySelector("goa-modal[testId='notification-types-form']");
      expect(form).not.toBeNull();
    });
  });

  it('creates a new notification type', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const addBtn = baseElement.querySelector("goa-button[testId='add-notification']");
    fireEvent.click(addBtn);

    // fields
    const name = baseElement.querySelector("goa-input[testId='form-name']");
    const description = baseElement.querySelector("goa-textarea[testId='form-description']");
    const cancelBtn = baseElement.querySelector("goa-button[testId='form-cancel']");
    const saveBtn = baseElement.querySelector("goa-button[testId='form-save']");

    expect(name).toBeTruthy();
    expect(description).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // fill

    fireEvent(
      description,
      new CustomEvent('_change', {
        detail: { value: 'description' },
      })
    );
    fireEvent.click(saveBtn);

    const actions = store.getActions();

    const saveAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);

    expect(saveAction).toBeTruthy();
  });

  it('add an event', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const addBtn = baseElement.querySelectorAll("goa-button[testId='add-event']")[1];
    await waitFor(() => {
      fireEvent.click(addBtn);
    });

    // fields
    const eventDropDown = baseElement.querySelector('goa-dropdown');
    const cancelBtn = baseElement.querySelector("goa-button[testId='event-form-cancel']");
    const saveBtn = baseElement.querySelector("goa-button[testId='event-form-save']");

    expect(eventDropDown).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // fill
    fireEvent.click(baseElement.querySelector('goa-dropdown'));
    const el = baseElement.querySelector('goa-dropdown');
    fireEvent(
      el,
      new CustomEvent('_change', {
        detail: { name: 'foo:bar', value: 'foo:bar' },
      })
    );

    fireEvent.click(saveBtn);

    const actions = store.getActions();

    const saveAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);
    expect(saveAction).toBeTruthy();
  });

  it('edit an event', async () => {
    const { getAllByTestId, baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const editBtn = getAllByTestId('edit-event')[0];
    await waitFor(() => {
      fireEvent.click(editBtn);
    });

    // fields
    const cancelBtn = baseElement.querySelector("goa-button[testId='template-form-close']");
    const saveBtn = baseElement.querySelector("goa-button[testId='template-form-save']");

    expect(cancelBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // fill

    fireEvent.click(saveBtn);

    const actions = store.getActions();
    const saveAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);
    expect(saveAction).toBeTruthy();
  });
  it('edit notification type should have title and subtitle field', async () => {
    const { getAllByTestId, queryByTestId, queryAllByText, baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );

    const editBtn = getAllByTestId('edit-event')[0];
    await waitFor(() => {
      fireEvent.click(editBtn);
    });

    const titleField = queryByTestId('templated-editor-title');
    const subtitleField = queryByTestId('templated-editor-subtitle');
    expect(titleField).toBeTruthy();
    expect(subtitleField).toBeTruthy();
  });

  it('deletes an event', async () => {
    const { baseElement } = render(
      <Provider store={store}>
        <NotificationTypes />
      </Provider>
    );
    const deleteBtn = baseElement.querySelectorAll("goa-icon-button[testId='delete-event']")[0];

    fireEvent(deleteBtn, new CustomEvent('_click'));
    const confirmation = baseElement.querySelector('goa-modal');
    const actionContent = confirmation.querySelector("[slot='actions']");
    const deleteConfirm = actionContent.querySelector("[testid='delete-confirm']");
    expect(confirmation).not.toBeNull();

    fireEvent(deleteConfirm, new CustomEvent('_click'));

    const actions = store.getActions();
    const deleteAction = actions.find((action) => action.type === UPDATE_NOTIFICATION_TYPE);
    expect(deleteAction).toBeTruthy();
  });
});
