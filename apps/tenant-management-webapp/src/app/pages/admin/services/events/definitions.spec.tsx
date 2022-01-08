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
    session: { realm: 'core' },
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
    fireEvent.click(addDefButton);
    const dialog = queryByTestId('definition-form');
    await waitFor(() => {
      expect(dialog).not.toBeNull();
    });
  });

  it('deletes a definition', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const deleteBtn = queryByTestId('delete-details');
    fireEvent.click(deleteBtn);
    const confirmation = queryByTestId('delete-confirmation');
    expect(confirmation).not.toBeNull();
    const deleteConfirm = queryByTestId('delete-confirm');
    fireEvent.click(deleteConfirm);
    const actions = store.getActions();
    const deleteAction = actions.find((action) => action.type === DELETE_EVENT_DEFINITION_ACTION);
    expect(deleteAction).toBeTruthy();
  });

  it('cancels deleting a definition', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const deleteBtn = queryByTestId('delete-details');
    fireEvent.click(deleteBtn);

    const deleteCancel = queryByTestId('delete-cancel');
    fireEvent.click(deleteCancel);

    await waitFor(() => {
      expect(queryByTestId('delete-cancel')).toBeNull();
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
    fireEvent.click(toggleDetails);
    expect(queryByTestId('details')).toBeTruthy();
    // hide
    fireEvent.click(toggleDetails);
    expect(queryByTestId('details')).toBeFalsy();
  });

  it('edits the definition', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const editBtn = queryByTestId('edit-details');
    fireEvent.click(editBtn);

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
    fireEvent.click(saveBtn);

    const actions = store.getActions();
    const saveAction = actions.find((action) => action.type === UPDATE_EVENT_DEFINITION_ACTION);

    expect(saveAction).toBeTruthy();
  });

  it('cancels editing the definition', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );

    const editBtn = queryByTestId('edit-details');
    fireEvent.click(editBtn);

    const cancelButton = queryByTestId('form-cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      const form = queryByTestId('definition-form');
      expect(form).toBeNull();
    });
  });

  it('creates a new definition', async () => {
    const { queryByTestId } = render(
      <Provider store={store}>
        <Definitions />
      </Provider>
    );
    const addBtn = queryByTestId('add-definition');
    fireEvent.click(addBtn);

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
    fireEvent.change(namespace, { target: { value: 'namespace' } });
    fireEvent.change(name, { target: { value: 'name' } });
    fireEvent.change(description, { target: { value: 'description' } });
    fireEvent.click(saveBtn);

    const actions = store.getActions();
    const saveAction = actions.find((action) => action.type === UPDATE_EVENT_DEFINITION_ACTION);
    expect(saveAction).toBeTruthy();
  });
});
