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
        saving={true}
      />
    </Provider>
  );

  const saveButton = baseElement.querySelector("goa-button[testId='value-save']");

  expect(saveButton).toBeDisabled();
  expect(saveButton).toHaveTextContent('Saving...');
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

test('keeps description text that arrives without a keystroke, as a mouse paste does', async () => {
  const store = mockStore(initialState);
  const onSave = jest.fn();

  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={onSave}
        initialValue={{ ...initialValue, namespace: 'ns', name: 'thing' }}
        open={true}
        isEdit={true}
        onClose={() => {}}
        values={[]}
      />
    </Provider>
  );

  const description = baseElement.querySelector("goa-textarea[testId='value-description']");
  expect(description).toBeInTheDocument();

  fireEvent(description, new CustomEvent('_change', { detail: { value: 'pasted description' } }));

  await waitFor(() => {
    expect(baseElement.querySelector("goa-textarea[testId='value-description']")).toHaveAttribute(
      'value',
      'pasted description'
    );
  });
});

test('shows save error inside the modal', () => {
  const store = mockStore(initialState);
  render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={() => {}}
        initialValue={initialValue}
        open={true}
        isEdit={false}
        onClose={() => {}}
        values={[]}
        saveError="Value definition has an invalid JSON schema"
      />
    </Provider>
  );

  expect(screen.getByText('Value definition has an invalid JSON schema')).toBeInTheDocument();
});

test('shows duplicate value definition error on the name field', async () => {
  const store = mockStore(initialState);

  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={() => {}}
        initialValue={{ ...initialValue, namespace: 'test', name: 'response-time' }}
        open={true}
        isEdit={false}
        onClose={() => {}}
        values={[{ ...initialValue, namespace: 'test', name: 'response-time' }]}
      />
    </Provider>
  );

  fireEvent(baseElement.querySelector("goa-button[testId='value-save']"), new CustomEvent('_click'));

  await waitFor(() => {
    const nameFormItem = baseElement.querySelector("goa-input[testId='value-name']")?.closest('goa-form-item');
    expect(nameFormItem?.getAttribute('error')).toContain('Value');
  });
});

test('does not close the modal when save is clicked', async () => {
  const store = mockStore(initialState);
  const onSave = jest.fn();
  const onClose = jest.fn();

  const definition = {
    ...initialValue,
    namespace: 'test',
    name: 'response-time',
    jsonSchema: { type: 'object' },
  };

  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={onSave}
        initialValue={definition}
        open={true}
        isEdit={true}
        onClose={onClose}
        values={[]}
      />
    </Provider>
  );

  fireEvent(baseElement.querySelector("goa-button[testId='value-save']"), new CustomEvent('_click'));

  await waitFor(() => {
    expect(onSave).toHaveBeenCalledWith(definition);
  });
  expect(onClose).not.toHaveBeenCalled();
});

test('does not save value definition with invalid JSON schema', async () => {
  const store = mockStore(initialState);
  const onSave = jest.fn();
  const onClose = jest.fn();
  const scrollIntoView = jest.fn();
  window.HTMLElement.prototype.scrollIntoView = scrollIntoView;

  const definition = {
    ...initialValue,
    namespace: 'test',
    name: 'response-time',
    jsonSchema: { type: 'objectx' },
  };

  const { baseElement } = render(
    <Provider store={store}>
      <AddEditValueDefinition
        onSave={onSave}
        initialValue={definition}
        open={true}
        isEdit={true}
        onClose={onClose}
        values={[]}
      />
    </Provider>
  );

  fireEvent(baseElement.querySelector("goa-button[testId='value-save']"), new CustomEvent('_click'));

  await waitFor(() => {
    const schemaFormItem = baseElement.querySelector("goa-form-item[label='Payload schema']");
    const schemaError = baseElement.querySelector("[data-testid='value-schema-error']");
    expect(schemaFormItem?.getAttribute('error')).toBeNull();
    expect(schemaError).toHaveTextContent('Invalid schema type "objectx"');
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'end' });
  });
  expect(onSave).not.toHaveBeenCalled();
  expect(onClose).not.toHaveBeenCalled();
});
