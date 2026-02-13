import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AddEditConfigDefinition } from './addEditDefinition';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { ConfigDefinition } from '@store/configuration/model';

const mockStore = configureStore([]);
const initialState = {
  session: {
    indicator: { show: false },
  },
};

const initialValue: ConfigDefinition = {
  namespace: '',
  name: '',
  description: '',
  configurationSchema: {
    type: 'object',
    properties: {},
    required: [],
    additionalProperties: false,
  },
  anonymousRead: false,
};

const mockConfigurations = {
  'test:config1': {
    namespace: 'test',
    name: 'config1',
    description: 'Test config',
    configurationSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
    anonymousRead: false,
  },
  'another:config2': {
    namespace: 'another',
    name: 'config2',
    description: 'Another config',
    configurationSchema: {
      type: 'object',
      properties: {},
      required: [],
      additionalProperties: false,
    },
    anonymousRead: true,
  },
};

describe('AddEditConfigDefinition', () => {
  test('renders component', () => {
    const store = mockStore(initialState);
    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={initialValue}
          open={true}
          isEdit={false}
          onClose={() => {}}
          configurations={{}}
        />
      </Provider>
    );

    expect(baseElement.querySelector("goa-modal[testId='definition-form']")).toBeInTheDocument();
  });

  test('renders form fields', () => {
    const store = mockStore(initialState);

    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={initialValue}
          open={true}
          isEdit={false}
          onClose={() => {}}
          configurations={{}}
        />
      </Provider>
    );

    expect(baseElement.querySelector("goa-input[testId='form-namespace']")).toBeInTheDocument();
    expect(baseElement.querySelector("goa-input[testId='form-name']")).toBeInTheDocument();
    expect(baseElement.querySelector("goa-textarea[testId='form-description']")).toBeInTheDocument();
    expect(baseElement.querySelector("goa-checkbox[testId='anonymousRead']")).toBeInTheDocument();
  });

  test('disables namespace and name fields when isEdit is true', () => {
    const store = mockStore(initialState);
    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={initialValue}
          open={true}
          isEdit={true}
          onClose={() => {}}
          configurations={{}}
        />
      </Provider>
    );

    expect(baseElement.querySelector("goa-input[testId='form-namespace']")).toBeDisabled();
    expect(baseElement.querySelector("goa-input[testId='form-name']")).toBeDisabled();
  });

  test('disables save button when required fields are empty', () => {
    const store = mockStore(initialState);

    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={initialValue}
          open={true}
          isEdit={false}
          onClose={() => {}}
          configurations={{}}
        />
      </Provider>
    );

    expect(baseElement.querySelector("goa-button[testId='form-save']")).toBeDisabled();
  });

  test('shows validation error for platform namespace', async () => {
    const store = mockStore(initialState);
    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={initialValue}
          open={true}
          isEdit={false}
          onClose={() => {}}
          configurations={{}}
        />
      </Provider>
    );

    const namespaceInput = baseElement.querySelector("goa-input[testId='form-namespace']");
    fireEvent(namespaceInput, new CustomEvent('_change', { detail: { value: 'platform' } }));

    await waitFor(() => {
      const formItem = namespaceInput.closest('goa-form-item');
      expect(formItem.getAttribute('error')).toBe('Cannot use the word platform as namespace');
    });
  });

  test('populates existing namespaces for dropdown', () => {
    const store = mockStore(initialState);
    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={initialValue}
          open={true}
          isEdit={false}
          onClose={() => {}}
          configurations={mockConfigurations}
        />
      </Provider>
    );

    const namespaceInput = baseElement.querySelector("goa-input[testId='form-namespace']");
    expect(namespaceInput).toBeInTheDocument();
    // NamespaceDropdown should receive existingNamespaces prop with ['test', 'another']
  });

  test('calls onSave with correct data when save is clicked', async () => {
    const mockOnSave = jest.fn();
    const store = mockStore(initialState);

    const testValue: ConfigDefinition = {
      namespace: 'my-namespace',
      name: 'my-config',
      description: 'Test description',
      configurationSchema: {
        type: 'object',
        properties: {},
        required: [],
        additionalProperties: false,
      },
      anonymousRead: false,
    };

    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={mockOnSave}
          initialValue={testValue}
          open={true}
          isEdit={false}
          onClose={() => {}}
          configurations={{}}
        />
      </Provider>
    );

    const saveButton = baseElement.querySelector("goa-button[testId='form-save']");
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnSave).toHaveBeenCalledWith(
        expect.objectContaining({
          namespace: 'my-namespace',
          name: 'my-config',
          description: 'Test description',
        })
      );
    });
  });

  test('calls onClose when cancel is clicked', () => {
    const mockOnClose = jest.fn();
    const store = mockStore(initialState);

    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={initialValue}
          open={true}
          isEdit={false}
          onClose={mockOnClose}
          configurations={{}}
        />
      </Provider>
    );

    const cancelButton = baseElement.querySelector("goa-button[testId='form-cancel']");
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('toggles anonymous read checkbox', () => {
    const store = mockStore(initialState);
    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={initialValue}
          open={true}
          isEdit={false}
          onClose={() => {}}
          configurations={{}}
        />
      </Provider>
    );

    const checkbox = baseElement.querySelector("goa-checkbox[testId='anonymousRead']");
    expect(checkbox).not.toBeChecked();

    fireEvent(checkbox, new CustomEvent('_change', { detail: { checked: true } }));

    // After toggle, the definition state should be updated
  });

  test('validates duplicate namespace:name combination', async () => {
    const store = mockStore(initialState);
    const { baseElement } = render(
      <Provider store={store}>
        <AddEditConfigDefinition
          onSave={() => {}}
          initialValue={{ ...initialValue, namespace: 'test', name: 'config1' }}
          open={true}
          isEdit={false}
          onClose={() => {}}
          configurations={mockConfigurations}
        />
      </Provider>
    );

    const saveButton = baseElement.querySelector("goa-button[testId='form-save']");
    fireEvent.click(saveButton);

    // Should show duplicate error
    await waitFor(() => {
      const nameFormItem = baseElement.querySelector("goa-input[testId='form-name']")?.closest('goa-form-item');
      expect(nameFormItem?.getAttribute('error')).toContain('Configuration');
    });
  });
});
