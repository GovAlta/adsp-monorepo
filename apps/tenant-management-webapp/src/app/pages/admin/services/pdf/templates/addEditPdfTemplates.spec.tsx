import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AddEditPdfTemplate } from './addEditPdfTemplates';
import { defaultPdfTemplate } from '@store/pdf/model';

const mockStore = configureStore([]);
const initialState = {
  session: { indicator: { show: false } },
  pdf: { pdfTemplates: {}, corePdfTemplates: {} },
};

describe('AddEditPdfTemplate', () => {
  const renderModal = (store, open: boolean) => (
    <Provider store={store}>
      <AddEditPdfTemplate
        open={open}
        isEdit={false}
        initialValue={defaultPdfTemplate}
        onClose={() => {}}
        onSave={() => {}}
      />
    </Provider>
  );

  it('clears entered values when the modal is closed and opened again', () => {
    const store = mockStore(initialState);
    const { baseElement, rerender } = render(renderModal(store, true));

    fireEvent(
      baseElement.querySelector("goa-input[testId='pdf-template-name']"),
      new CustomEvent('_change', { detail: { value: 'Draft Template' } }),
    );
    fireEvent(
      baseElement.querySelector("goa-textarea[testId='pdf-template-description']"),
      new CustomEvent('_change', { detail: { value: 'draft description' } }),
    );

    expect(baseElement.querySelector("goa-input[testId='pdf-template-name']")).toHaveAttribute('value', 'Draft Template');
    expect(baseElement.querySelector("goa-input[testId='pdf-template-id']")).toHaveAttribute('value', 'draft-template');
    expect(baseElement.querySelector("goa-textarea[testId='pdf-template-description']")).toHaveAttribute(
      'value',
      'draft description',
    );

    // cancel, then open again
    rerender(renderModal(store, false));
    rerender(renderModal(store, true));

    expect(baseElement.querySelector("goa-input[testId='pdf-template-name']")).toHaveAttribute('value', '');
    expect(baseElement.querySelector("goa-input[testId='pdf-template-id']")).toHaveAttribute('value', '');
    expect(baseElement.querySelector("goa-textarea[testId='pdf-template-description']")).toHaveAttribute('value', '');
  });

  it('does not write the populate-template toggle back into the shared default template', () => {
    const store = mockStore(initialState);
    const pristine = { ...defaultPdfTemplate };
    const { baseElement } = render(renderModal(store, true));

    // Unticking used to mutate `template` in place, which on a fresh open is
    // defaultPdfTemplate itself, blanking the default html for the whole session.
    fireEvent(
      baseElement.querySelector("goa-checkbox[testId='populate-template']"),
      new CustomEvent('_change', { detail: { checked: false } }),
    );

    expect(defaultPdfTemplate).toEqual(pristine);
  });

  it('reflects the populate-template toggle in the checkbox', () => {
    const store = mockStore(initialState);
    const { baseElement } = render(renderModal(store, true));
    const checkbox = () => baseElement.querySelector("goa-checkbox[testId='populate-template']");

    expect(checkbox()).toHaveAttribute('checked', 'true');

    fireEvent(checkbox(), new CustomEvent('_change', { detail: { checked: false } }));

    expect(checkbox()).not.toHaveAttribute('checked', 'true');
  });
});
