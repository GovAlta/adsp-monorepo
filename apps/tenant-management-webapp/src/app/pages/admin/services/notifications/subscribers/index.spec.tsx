import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SUBSCRIBER_INIT } from '@store/subscription/models';
import { Subscribers } from '.';
import { CREATE_SUBSCRIBER, DELETE_SUBSCRIBER, FIND_SUBSCRIBERS, UPDATE_SUBSCRIBER } from '@store/subscription/actions';

describe('Notification - Recipient registry tab', () => {
  const mockStore = configureStore([]);
  const subscribers = {
    '61bd151b6d95d24f4cf632cf': {
      id: '61bd151b6d95d24f4cf632cf',
      addressAs: 'user-a',
      created: '2026-01-02T18:00:00.000Z',
      updated: '2026-02-03T18:00:00.000Z',
      channels: [
        { channel: 'email', address: 'jonathan.weyermann@gov.ab.ca', verified: false },
        { channel: 'sms', address: '1234561234', verified: false },
      ],
    },
    '61bd151b6d95d24f4cf632cc': {
      id: '61bd151b6d95d24f4cf632cc',
      addressAs: 'user-b',
      channels: [{ channel: 'email', address: 'weyermannx@gmail.com', verified: true }],
    },
    '61bd151b6d95d24f4cf632c1': {
      id: '61bd151b6d95d24f4cf632c1',
      addressAs: 'user-c',
      channels: [{ channel: 'slack', address: 'slack-only@gmail.com', verified: false }],
    },
  };

  const createStore = (subscriberSearch = {}) =>
    mockStore({
      subscription: {
        ...SUBSCRIBER_INIT,
        subscribers,
        subscriberSearch: {
          results: ['61bd151b6d95d24f4cf632cf', '61bd151b6d95d24f4cf632cc', '61bd151b6d95d24f4cf632c1'],
          next: null,
          total: 3,
          ...subscriberSearch,
        },
      },
      tenant: {
        adminEmail: 'agent.smith@matrix.com',
      },
      notifications: {
        notifications: [],
      },
      session: {
        resourceAccess: { 'urn:ads:platform:notification-service': { roles: ['subscription-admin'] } },
        indicator: {
          show: false,
        },
      },
    });

  const lastFindSubscribers = (store) =>
    store
      .getActions()
      .filter((action) => action.type === FIND_SUBSCRIBERS)
      .pop();

  it('renders', () => {
    const { baseElement, queryByTestId } = render(
      <Provider store={createStore()}>
        <Subscribers />
      </Provider>,
    );

    expect(queryByTestId('subscribers-list-title')).toBeTruthy();
    expect(baseElement.querySelector("goa-table[testId='recipient-registry-table']")).toBeTruthy();
  });

  it('shows the contact details and verification status of each recipient in the table', () => {
    const { getByTestId } = render(
      <Provider store={createStore()}>
        <Subscribers />
      </Provider>,
    );

    const row = within(getByTestId('recipient-row-61bd151b6d95d24f4cf632cf'));
    expect(row.getByText('user-a')).toBeTruthy();
    expect(row.getByText('jonathan.weyermann@gov.ab.ca')).toBeTruthy();
    expect(row.getByText('123 456 1234')).toBeTruthy();
  });

  it('shows the total number of recipients above the table', () => {
    const { getByTestId } = render(
      <Provider store={createStore()}>
        <Subscribers />
      </Provider>,
    );

    expect(getByTestId('recipient-total-count')).toHaveTextContent('3 recipients');
  });

  it('shows how many recipients are showing out of the total', () => {
    const { getByTestId } = render(
      <Provider store={createStore()}>
        <Subscribers />
      </Provider>,
    );

    expect(getByTestId('recipient-result-count')).toHaveTextContent('Showing 1–3 of 3 recipients');
  });

  it('searches on a single value', async () => {
    const store = createStore();
    const { baseElement } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    // Searching follows the typing, so pressing enter is the only way to ask for it without
    // waiting out the debounce.
    const input = baseElement.querySelector("goa-input[testId='recipient-search-input']");
    fireEvent(input, new CustomEvent('_keyPress', { detail: { name: 'search', value: 'smith', key: 'Enter' } }));

    await waitFor(() =>
      expect(lastFindSubscribers(store).payload).toEqual(expect.objectContaining({ search: 'smith' })),
    );
  });

  it('sorts on a column chosen from the table header', async () => {
    const store = createStore();
    const { baseElement } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    const table = baseElement.querySelector("goa-table[testId='recipient-registry-table']");
    fireEvent(table, new CustomEvent('_sort', { detail: { sortBy: 'sms', sortDir: -1 } }));

    await waitFor(() =>
      expect(lastFindSubscribers(store).payload).toEqual(
        expect.objectContaining({ sort: { column: 'sms', direction: 'desc' } }),
      ),
    );
  });

  it('pages forward with the chevron and back again', async () => {
    const store = createStore({ next: 'MTA=' });
    const { baseElement } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    fireEvent(baseElement.querySelector("goa-icon-button[testId='recipient-page-next']"), new CustomEvent('_click'));
    await waitFor(() => expect(lastFindSubscribers(store).payload).toEqual(expect.objectContaining({ next: 'MTA=' })));

    fireEvent(
      baseElement.querySelector("goa-icon-button[testId='recipient-page-previous']"),
      new CustomEvent('_click'),
    );
    await waitFor(() => expect(lastFindSubscribers(store).payload).toEqual(expect.objectContaining({ next: null })));
  });

  it('cannot page back from the first page', () => {
    const { baseElement } = render(
      <Provider store={createStore()}>
        <Subscribers />
      </Provider>,
    );

    expect(baseElement.querySelector("goa-icon-button[testId='recipient-page-previous']")).toHaveAttribute('disabled');
  });

  it('shows the details of the selected recipient', async () => {
    const { getByTestId, queryByTestId } = render(
      <Provider store={createStore()}>
        <Subscribers />
      </Provider>,
    );

    expect(queryByTestId('recipient-details-empty')).toBeTruthy();

    fireEvent.click(getByTestId('recipient-row-61bd151b6d95d24f4cf632cf'));

    await waitFor(() => expect(getByTestId('recipient-details-name')).toHaveTextContent('user-a'));
    expect(getByTestId('recipient-details-email')).toHaveTextContent('jonathan.weyermann@gov.ab.ca');
    expect(getByTestId('recipient-details-phone')).toHaveTextContent('123 456 1234');
    expect(getByTestId('recipient-details-created')).not.toHaveTextContent('-');
    expect(getByTestId('recipient-details-updated')).not.toHaveTextContent('-');
  });

  it('selects a recipient from the keyboard', async () => {
    const { getByTestId } = render(
      <Provider store={createStore()}>
        <Subscribers />
      </Provider>,
    );

    const selectButton = getByTestId('recipient-select-61bd151b6d95d24f4cf632cc');
    expect(selectButton.tagName).toBe('BUTTON');
    fireEvent.click(selectButton);

    await waitFor(() => expect(getByTestId('recipient-details-name')).toHaveTextContent('user-b'));
    expect(selectButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('edits the selected recipient from the details pane', async () => {
    const store = createStore();
    const { baseElement, getByTestId } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    fireEvent.click(getByTestId('recipient-row-61bd151b6d95d24f4cf632cf'));

    const editBtn = await waitFor(() =>
      baseElement.querySelector("goa-icon-button[testId='recipient-details-edit-61bd151b6d95d24f4cf632cf']"),
    );
    fireEvent(editBtn, new CustomEvent('_click'));

    const name = await waitFor(() => baseElement.querySelectorAll("goa-input[testId='form-name']")[1]);
    const email = baseElement.querySelectorAll("goa-input[testId='form-email']")[1];
    fireEvent(name, new CustomEvent('_change', { detail: { value: 'Bob Smith' } }));
    fireEvent(email, new CustomEvent('_change', { detail: { value: 'bob.smith@gmail.com' } }));
    fireEvent(baseElement.querySelectorAll("goa-button[testId='form-save']")[1], new CustomEvent('_click'));

    await waitFor(() => expect(store.getActions().find((action) => action.type === UPDATE_SUBSCRIBER)).toBeTruthy());
  });

  it('deletes the selected recipient from the details pane', async () => {
    const store = createStore();
    const { baseElement, getByTestId } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    fireEvent.click(getByTestId('recipient-row-61bd151b6d95d24f4cf632cf'));

    const deleteBtn = await waitFor(() =>
      baseElement.querySelector("goa-icon-button[testId='recipient-details-delete']"),
    );
    fireEvent(deleteBtn, new CustomEvent('_click'));

    await waitFor(() => expect(getByTestId('delete-subscriber-name')).toHaveTextContent('user-a'));
    fireEvent(baseElement.querySelector("goa-button[testId='delete-confirm']"), new CustomEvent('_click'));

    await waitFor(() =>
      expect(store.getActions().find((action) => action.type === DELETE_SUBSCRIBER)).toEqual({
        type: DELETE_SUBSCRIBER,
        payload: { subscriberId: '61bd151b6d95d24f4cf632cf' },
      }),
    );
  });

  it('adds a subscriber with a name and email', async () => {
    const store = createStore();
    const { baseElement } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    const addBtn = baseElement.querySelector("goa-button[testId='add-subscriber']");
    fireEvent(addBtn, new CustomEvent('_click'));

    await waitFor(() =>
      expect(baseElement.querySelectorAll("goa-input[testId='form-name']").length).toBeGreaterThan(0),
    );
    const name = baseElement.querySelectorAll("goa-input[testId='form-name']")[0];
    const email = baseElement.querySelectorAll("goa-input[testId='form-email']")[0];
    const saveBtn = baseElement.querySelectorAll("goa-button[testId='form-save']")[0];

    fireEvent(name, new CustomEvent('_change', { detail: { value: 'General mailbox' } }));
    fireEvent(email, new CustomEvent('_change', { detail: { value: 'general.mailbox@gov.ab.ca' } }));
    fireEvent(saveBtn, new CustomEvent('_click'));

    await waitFor(() => {
      const createAction = store.getActions().find((action) => action.type === CREATE_SUBSCRIBER);
      expect(createAction).toEqual({
        type: CREATE_SUBSCRIBER,
        payload: {
          subscriber: {
            addressAs: 'General mailbox',
            channels: [{ channel: 'email', address: 'general.mailbox@gov.ab.ca', verified: false }],
          },
        },
      });
    });
  });

  it('requires a name and valid email when adding a subscriber', async () => {
    const store = createStore();
    const { baseElement } = render(
      <Provider store={store}>
        <Subscribers />
      </Provider>,
    );

    fireEvent(baseElement.querySelector("goa-button[testId='add-subscriber']"), new CustomEvent('_click'));
    await waitFor(() =>
      expect(baseElement.querySelectorAll("goa-button[testId='form-save']").length).toBeGreaterThan(0),
    );
    fireEvent(baseElement.querySelectorAll("goa-button[testId='form-save']")[0], new CustomEvent('_click'));

    expect(store.getActions().filter((action) => action.type === CREATE_SUBSCRIBER)).toHaveLength(0);
  });
});
