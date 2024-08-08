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

const renderWithProvider = (ui, store) => {
  return render(<Provider store={store}>{ui}</Provider>);
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
  renderWithProvider(
    <AddEditValueDefinition
      onSave={() => {}}
      initialValue={initialValue}
      open={true}
      isEdit={false}
      onClose={() => {}}
      values={[]}
    />,
    store
  );
  expect(screen.getByTestId('definition-value')).toBeInTheDocument();
});

test('renders form fields', () => {
  const store = mockStore(initialState);
  renderWithProvider(
    <AddEditValueDefinition
      onSave={() => {}}
      initialValue={initialValue}
      open={true}
      isEdit={false}
      onClose={() => {}}
      values={[]}
    />,
    store
  );

  expect(screen.getByTestId('value-namespace')).toBeInTheDocument();
  expect(screen.getByTestId('value-name')).toBeInTheDocument();
  expect(screen.getByTestId('value-description')).toBeInTheDocument();
  expect(screen.getByText('Loading...')).toBeInTheDocument();
});

test('disables namespace and name fields when isEdit is true', () => {
  const store = mockStore(initialState);
  renderWithProvider(
    <AddEditValueDefinition
      onSave={() => {}}
      initialValue={initialValue}
      open={true}
      isEdit={true}
      onClose={() => {}}
      values={[]}
    />,
    store
  );

  expect(screen.getByTestId('value-namespace')).toBeDisabled();
  expect(screen.getByTestId('value-name')).toBeDisabled();
});

test('disables save button with validation errors', () => {
  const store = mockStore(initialState);
  renderWithProvider(
    <AddEditValueDefinition
      onSave={() => {}}
      initialValue={initialValue}
      open={true}
      isEdit={false}
      onClose={() => {}}
      values={[]}
    />,
    store
  );

  expect(screen.getByTestId('value-save')).toBeDisabled();
});

test('shows spinner based on loading indicator', () => {
  const store = mockStore({
    session: {
      indicator: { show: true },
    },
  });

  renderWithProvider(
    <AddEditValueDefinition
      onSave={() => {}}
      initialValue={initialValue}
      open={true}
      isEdit={false}
      onClose={() => {}}
      values={[]}
    />,
    store
  );

  fireEvent.click(screen.getByTestId('value-save'));
  expect(screen.getByTestId('value-save')).toHaveAttribute('disabled');
});

test('shows validation errors', async () => {
  const store = mockStore(initialState);
  renderWithProvider(
    <AddEditValueDefinition
      onSave={() => {}}
      initialValue={initialValue}
      open={true}
      isEdit={false}
      onClose={() => {}}
      values={[]}
    />,
    store
  );
  const namespaceInput = screen.getByTestId('value-namespace');
  fireEvent(namespaceInput, new CustomEvent('_change', { detail: { value: 'platform' } }));
  await waitFor(() => {
    const formItem = namespaceInput.closest('goa-form-item');
    expect(formItem.getAttribute('error')).toBe('Cannot use the word platform as namespace');
  });
});
