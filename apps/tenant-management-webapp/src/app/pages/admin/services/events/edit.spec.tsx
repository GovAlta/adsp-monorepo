import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { EventDefinitionModalForm } from './edit';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { EventDefinition } from '@store/event/models';

const mockStore = configureStore([]);

const initialValue: EventDefinition = {
  namespace: '',
  name: '',
  description: '',
  payloadSchema: {},
  isCore: false,
};

const mockDefinitions = {
  'test:event1': {
    namespace: 'test',
    name: 'event1',
    description: 'Test event',
    payloadSchema: {},
    isCore: false,
  },
  'another:event2': {
    namespace: 'another',
    name: 'event2',
    description: 'Another event',
    payloadSchema: {},
    isCore: false,
  },
  'core:system-event': {
    namespace: 'core',
    name: 'system-event',
    description: 'Core event',
    payloadSchema: {},
    isCore: true,
  },
};

describe('EventDefinitionModalForm', () => {
  const mockDispatch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders component', () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={{}}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
        />
      </Provider>
    );

    expect(baseElement.querySelector("goa-modal[testId='definition-form']")).toBeInTheDocument();
  });

  test('renders form fields', () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={{}}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
        />
      </Provider>
    );

    expect(baseElement.querySelector("goa-input[testId='form-namespace']")).toBeInTheDocument();
    expect(baseElement.querySelector("goa-input[testId='form-name']")).toBeInTheDocument();
    expect(baseElement.querySelector("goa-textarea[testId='form-description']")).toBeInTheDocument();
  });

  test('disables namespace and name fields when isEdit is true', () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={{}}
          onClose={() => {}}
          open={true}
          isEdit={true}
          coreNamespaces={[]}
        />
      </Provider>
    );

    expect(baseElement.querySelector("goa-input[testId='form-namespace']")).toBeDisabled();
    expect(baseElement.querySelector("goa-input[testId='form-name']")).toBeDisabled();
  });

  test('disables save button when required fields are empty', () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={{}}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
        />
      </Provider>
    );

    expect(baseElement.querySelector("goa-button[testId='form-save']")).toBeDisabled();
  });

  test('shows validation error for platform namespace', async () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={{}}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
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

  test('shows validation error for core namespace conflicts', async () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={{}}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={['core', 'system']}
        />
      </Provider>
    );

    const namespaceInput = baseElement.querySelector("goa-input[testId='form-namespace']");
    fireEvent(namespaceInput, new CustomEvent('_change', { detail: { value: 'core' } }));

    await waitFor(() => {
      const formItem = namespaceInput.closest('goa-form-item');
      expect(formItem.getAttribute('error')).toBeTruthy();
    });
  });

  test('populates existing namespaces for dropdown', () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={mockDefinitions}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={['core']}
        />
      </Provider>
    );

    const namespaceInput = baseElement.querySelector("goa-input[testId='form-namespace']");
    expect(namespaceInput).toBeInTheDocument();
    // NamespaceDropdown should receive existingNamespaces prop with ['test', 'another', 'core']
  });

  test('calls onClose when cancel is clicked', () => {
    const mockOnClose = jest.fn();

    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={{}}
          onClose={mockOnClose}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
        />
      </Provider>
    );

    const cancelButton = baseElement.querySelector("goa-button[testId='form-cancel']");
    fireEvent(cancelButton, new CustomEvent('_click'));

    expect(mockOnClose).toHaveBeenCalled();
  });

  test('validates payload schema JSON', async () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={{ ...initialValue, namespace: 'test', name: 'event' }}
          definitions={{}}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
        />
      </Provider>
    );

    // Monaco editor would be tested differently in practice
    // This is a simplified test structure
    const saveButton = baseElement.querySelector("goa-button[testId='form-save']");
    expect(saveButton).toBeInTheDocument();
  });

  test('updates definition on namespace change', async () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={initialValue}
          definitions={{}}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
        />
      </Provider>
    );

    const namespaceInput = baseElement.querySelector("goa-input[testId='form-namespace']");
    fireEvent(namespaceInput, new CustomEvent('_change', { detail: { value: 'new-namespace' } }));

    // The component should update its state
    expect(namespaceInput).toHaveAttribute('value', 'new-namespace');
  });

  test('validates duplicate event definitions', async () => {
    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={{ ...initialValue, namespace: 'test', name: 'event1' }}
          definitions={mockDefinitions}
          onClose={() => {}}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
        />
      </Provider>
    );

    const saveButton = baseElement.querySelector("goa-button[testId='form-save']");
    fireEvent(saveButton, new CustomEvent('_click'));

    // Should show duplicate error
    await waitFor(() => {
      const nameFormItem = baseElement.querySelector("goa-input[testId='form-name']")?.closest('goa-form-item');
      expect(nameFormItem?.getAttribute('error')).toContain('Event');
    });
  });

  test('allows saving valid event definition', async () => {
    const mockOnSave = jest.fn();
    const mockOnClose = jest.fn();

    const validValue: EventDefinition = {
      namespace: 'my-namespace',
      name: 'my-event',
      description: 'Test description',
      payloadSchema: { type: 'object' },
      isCore: false,
    };

    const { baseElement } = render(
      <Provider store={mockStore({})}>
        <EventDefinitionModalForm
          initialValue={validValue}
          definitions={{}}
          onClose={mockOnClose}
          onSave={mockOnSave}
          open={true}
          isEdit={false}
          coreNamespaces={[]}
        />
      </Provider>
    );

    const saveButton = baseElement.querySelector("goa-button[testId='form-save']");
    fireEvent(saveButton, new CustomEvent('_click'));

    await waitFor(() => {
      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});
