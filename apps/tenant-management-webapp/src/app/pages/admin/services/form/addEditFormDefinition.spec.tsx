import { render, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AddEditFormDefinition } from '@form-editor-common/definitions/addEditFormDefinition';

const mockStore = configureStore([]);

const initialState = {
  form: {
    definitions: {},
    formResourceTag: { searchedTagExists: false },
  },
  session: { indicator: { show: false } },
  tenant: { name: 'autotest' },
  directory: { directory: [] },
};

const initialValue = {
  id: '',
  name: '',
  description: '',
  dataSchema: {},
  uiSchema: {},
  applicantRoles: [],
  clerkRoles: [],
  assessorRoles: [],
  formDraftUrlTemplate: '',
  anonymousApply: false,
};

const renderModal = (onSave = jest.fn()) =>
  render(
    <Provider store={mockStore(initialState)}>
      <AddEditFormDefinition
        open={true}
        isEdit={false}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        initialValue={initialValue as any}
        onClose={() => {}}
        onSave={onSave}
      />
    </Provider>
  );

describe('AddEditFormDefinition description', () => {
  it('renders the description textarea', () => {
    const { baseElement } = renderModal();

    expect(baseElement.querySelector("goa-textarea[testId='form-definition-description']")).toBeInTheDocument();
  });

  it('keeps description text that arrives without a keystroke, as a mouse paste does', async () => {
    const { baseElement } = renderModal();
    const description = baseElement.querySelector("goa-textarea[testId='form-definition-description']");

    fireEvent(description, new CustomEvent('_change', { detail: { value: 'pasted description' } }));

    await waitFor(() => {
      expect(baseElement.querySelector("goa-textarea[testId='form-definition-description']")).toHaveAttribute(
        'value',
        'pasted description'
      );
    });
  });

  it('reflects the pasted description in the character count', async () => {
    const { baseElement } = renderModal();
    const description = baseElement.querySelector("goa-textarea[testId='form-definition-description']");

    fireEvent(description, new CustomEvent('_change', { detail: { value: '12345' } }));

    await waitFor(() => {
      expect(baseElement.textContent).toContain('5/180');
    });
  });
});
