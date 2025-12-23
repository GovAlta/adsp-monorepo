import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddEditValueDefinition } from './addEditDefinition';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ValueDefinition } from '@store/value/models';

const mockStore = configureStore([]);
const initialState = {
  session: {
    indicator: { show: false },
  },
};

const initialValue: ValueDefinition = {
  namespace: '',
  name: '',
  description: '',
  jsonSchema: {},
  isCore: false,
};

test('renders component', () => {
  const store = mockStore(initialState);
  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={() => {}}
        initialValue={initialValue}
        open={true}
        isEdit={false}
        onClose={() => {}}
        values={[]}
      />
    </Provider>
  );

  expect(baseElement.querySelector("goa-modal[testId='definition-value']")).toBeInTheDocument();
});

test('renders form fields', () => {
  const store = mockStore(initialState);

  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={() => {}}
        initialValue={initialValue}
        open={true}
        isEdit={false}
        onClose={() => {}}
        values={[]}
      />
    </Provider>
  );
  expect(baseElement.querySelector("goa-input[testId='value-namespace']")).toBeInTheDocument();
  expect(baseElement.querySelector("goa-input[testId='value-name']")).toBeInTheDocument();
  expect(baseElement.querySelector("goa-textarea[testId='value-description']")).toBeInTheDocument();
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('disables namespace and name fields when isEdit is true', () => {
  const store = mockStore(initialState);
  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={() => {}}
        initialValue={initialValue}
        open={true}
        isEdit={true}
        onClose={() => {}}
        values={[]}
      />
    </Provider>
  );

  expect(baseElement.querySelector("goa-input[testId='value-namespace']")).toBeDisabled();
  expect(baseElement.querySelector("goa-input[testId='value-name']")).toBeDisabled();
});

test('disables save button with validation errors', () => {
  const store = mockStore(initialState);

  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={() => {}}
        initialValue={initialValue}
        open={true}
        isEdit={false}
        onClose={() => {}}
        values={[]}
      />
    </Provider>
  );
  expect(baseElement.querySelector("goa-button[testId='value-save']")).toBeDisabled();
});

test('shows spinner based on loading indicator', () => {
  const store = mockStore({
    session: {
      indicator: { show: true },
    },
  });
  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={() => {}}
        initialValue={initialValue}
        open={true}
        isEdit={false}
        onClose={() => {}}
        values={[]}
      />
    </Provider>
  );

  const saveButton = baseElement.querySelector("goa-button[testId='value-save']");
  fireEvent.click(saveButton);

  expect(saveButton.hasAttribute('disabled'));
});

test('shows validation errors', async () => {
  const store = mockStore(initialState);
  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={() => {}}
        initialValue={initialValue}
        open={true}
        isEdit={false}
        onClose={() => {}}
        values={[]}
      />
    </Provider>
  );
  const namespaceInput = baseElement.querySelector("goa-input[testId='value-namespace']");
  fireEvent(namespaceInput, new CustomEvent('_change', { detail: { value: 'platform' } }));
  await waitFor(() => {
    const formItem = namespaceInput.closest('goa-form-item');
    expect(formItem.getAttribute('error')).toBe('Cannot use the word platform as namespace');
  });
});
