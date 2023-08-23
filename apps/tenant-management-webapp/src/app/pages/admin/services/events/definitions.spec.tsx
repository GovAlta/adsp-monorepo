import React from 'react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import Definitions from './definitions';
import { DELETE_EVENT_DEFINITION_ACTION, UPDATE_EVENT_DEFINITION_ACTION } from '@store/event/actions';

describe('Definitions Page', () => {
  const mockStore = configureStore([]);

  const store = mockStore({
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
      results: ['foo:bar'],
    },
    user: { jwt: { token: '' } },
    session: {
      realm: 'core',
      indicator: {
        show: false,
      },
    },
  });

  it('renders', () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const addDefButton = queryByTestId('add-definition');
    expect(addDefButton).not.toBeNull();
  });

  it('allows for the definitions to be added', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const addDefButton = queryByTestId('add-definition');
    fireEvent(addDefButton, new CustomEvent('_click'));
    const dialog = queryByTestId('definition-form');
    await waitFor(() => {
      expect(dialog).not.toBeNull();
    });
  });

  it('deletes a definition', async () => {
    const { queryByTestId, baseElement } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const deleteBtn = queryByTestId('delete-details');
    fireEvent(deleteBtn, new CustomEvent('_click'));
    const confirmation = baseElement.querySelector('goa-modal');
    const actionContent = confirmation.querySelector("[slot='actions']");
    const deleteConfirm = actionContent.querySelector("[data-testid='delete-confirm']");

    fireEvent(deleteConfirm, new CustomEvent('_click'));
    const actions = store.getActions();
    const deleteAction = actions.find((action) => action.type === DELETE_EVENT_DEFINITION_ACTION);
    expect(deleteAction).toBeTruthy();
  });

  it('cancels deleting a definition', async () => {
    const { queryByTestId, baseElement } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const deleteBtn = queryByTestId('delete-details');

    fireEvent(deleteBtn, new CustomEvent('_click'));
    const confirmation = baseElement.querySelector('goa-modal');
    const actionContent = confirmation.querySelector("[slot='actions']");
    await waitFor(() => {
      expect(actionContent.querySelector("[data-testid='delete-cancel']")).toBeVisible();
    });
  });

  it('shows and hides the schema details', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );

    const toggleDetails = queryByTestId('toggle-details-visibility');

    // init
    expect(queryByTestId('details')).toBeFalsy();
    // show
    fireEvent(toggleDetails, new CustomEvent('_click'));
    expect(queryByTestId('details')).toBeTruthy();
    // hide
    fireEvent(toggleDetails, new CustomEvent('_click'));
    expect(queryByTestId('details')).toBeFalsy();
  });

  it('edits the definition', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const editBtn = queryByTestId('edit-details');
    fireEvent(editBtn, new CustomEvent('_click'));
    // fields
    const namespace = queryByTestId('form-namespace');
    const name = queryByTestId('form-name');
    const description = queryByTestId('form-description');
    const cancelBtn = queryByTestId('form-cancel');
    const saveBtn = queryByTestId('form-save');

    expect(namespace).not.toBeNull();
    expect(name).not.toBeNull();
    expect(description).not.toBeNull();
    expect(cancelBtn).not.toBeNull();
    expect(saveBtn).not.toBeNull();

    // fill
    fireEvent.change(description, { target: { value: 'the updated description' } });
    fireEvent(saveBtn, new CustomEvent('_click'));
    const actions = store.getActions();
    const saveAction = actions.find((action) => action.type === UPDATE_EVENT_DEFINITION_ACTION);

    expect(saveAction).toBeTruthy();
  });

  it('cancels editing the definition', async () => {
    const { queryByTestId, baseElement } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );

    const editBtn = queryByTestId('edit-details');
    fireEvent(editBtn, new CustomEvent('_click'));
    const confirmation = baseElement.querySelector('goa-modal');
    const actionContent = confirmation.querySelector("[slot='actions']");

    const cancelButton = actionContent.querySelector('goa-button');
    fireEvent(cancelButton, new CustomEvent('_click'));

    await waitFor(() => {
      expect(confirmation.getAttribute('open')).toBe('false');
    });
  });

  it('creates a new definition', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const addBtn = queryByTestId('add-definition');
    fireEvent(addBtn, new CustomEvent('_click'));
    // fields
    const namespace = queryByTestId('form-namespace');
    const name = queryByTestId('form-name');
    const description = queryByTestId('form-description');
    const cancelBtn = queryByTestId('form-cancel');
    const saveBtn = queryByTestId('form-save');

    expect(namespace).toBeTruthy();
    expect(name).toBeTruthy();
    expect(description).toBeTruthy();
    expect(cancelBtn).toBeTruthy();
    expect(saveBtn).toBeTruthy();

    // fill
    fireEvent(
      namespace,
      new CustomEvent('_change', {
        detail: { value: 'namespace' },
      })
    );
    fireEvent(
      name,
      new CustomEvent('_change', {
        detail: { value: 'name' },
      })
    );
    fireEvent(
      description,
      new CustomEvent('_change', {
        detail: { value: 'description' },
      })
    );

    fireEvent(saveBtn, new CustomEvent('_click'));
    const actions = store.getActions();
    const saveAction = actions.find((action) => action.type === UPDATE_EVENT_DEFINITION_ACTION);
    expect(saveAction).toBeTruthy();
  });
});
