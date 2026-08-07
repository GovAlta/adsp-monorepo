import React from 'react';
import '@testing-library/jest-dom';
import { fireEvent, render } from '@testing-library/react';

import { AddRegisterDataModal } from './addRegisterDataModal';

describe('AddRegisterDataModal', () => {
  it('renders the modal with a help text for the default (comma) separator', () => {
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} />);

    const formItem = baseElement.querySelector("goa-form-item[testId='data-register-add-data-formitem']");

    expect(formItem).not.toBeNull();
    expect(formItem?.getAttribute('helptext')).toContain('comma');
  });

  it('updates the help text when the separator changes', () => {
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} />);

    const separatorDropdown = baseElement.querySelector("goa-dropdown[testId='data-register-add-data-separator']");
    fireEvent(separatorDropdown, new CustomEvent('_change', { detail: { value: 'json' } }));

    const formItem = baseElement.querySelector("goa-form-item[testId='data-register-add-data-formitem']");

    expect(formItem?.getAttribute('helptext')).toContain('JSON');
  });

  it('shows an error and disables save when the data does not match the selected separator', () => {
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} />);

    const nameInput = baseElement.querySelector("goa-input[testId='data-register-add-name-input']");
    fireEvent(nameInput, new CustomEvent('_change', { detail: { value: 'weekdays' } }));

    const dataInput = baseElement.querySelector("goa-textarea[testId='data-register-add-data-input']");
    // separator is left as the default 'comma', but the data uses semicolons
    fireEvent(dataInput, new CustomEvent('_change', { detail: { value: 'Monday; Tuesday; Wednesday' } }));
    fireEvent(dataInput, new CustomEvent('_blur', { detail: { value: 'Monday; Tuesday; Wednesday' } }));

    const formItem = baseElement.querySelector("goa-form-item[testId='data-register-add-data-formitem']");
    const saveBtn = baseElement.querySelector("goa-button[testId='data-register-add-save']");

    expect(formItem?.getAttribute('error')).toContain('does not appear to use the selected');
    expect(saveBtn?.getAttribute('disabled')).toBe('true');
  });

  it('clears the error and enables save once the data matches the selected separator', () => {
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} />);

    const nameInput = baseElement.querySelector("goa-input[testId='data-register-add-name-input']");
    fireEvent(nameInput, new CustomEvent('_change', { detail: { value: 'weekdays' } }));

    const dataInput = baseElement.querySelector("goa-textarea[testId='data-register-add-data-input']");
    fireEvent(dataInput, new CustomEvent('_change', { detail: { value: 'Monday, Tuesday, Wednesday' } }));
    fireEvent(dataInput, new CustomEvent('_blur', { detail: { value: 'Monday, Tuesday, Wednesday' } }));

    const formItem = baseElement.querySelector("goa-form-item[testId='data-register-add-data-formitem']");
    const saveBtn = baseElement.querySelector("goa-button[testId='data-register-add-save']");

    expect(formItem?.getAttribute('error')).toBeFalsy();
    expect(saveBtn?.getAttribute('disabled')).not.toBe('true');
  });

  it('calls onSave with the parsed data when save is clicked', () => {
    const onSave = jest.fn();
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={onSave} />);

    const nameInput = baseElement.querySelector("goa-input[testId='data-register-add-name-input']");
    fireEvent(nameInput, new CustomEvent('_change', { detail: { value: 'weekdays' } }));

    const dataInput = baseElement.querySelector("goa-textarea[testId='data-register-add-data-input']");
    fireEvent(dataInput, new CustomEvent('_change', { detail: { value: 'Monday, Tuesday' } }));
    fireEvent(dataInput, new CustomEvent('_blur', { detail: { value: 'Monday, Tuesday' } }));

    const saveBtn = baseElement.querySelector("goa-button[testId='data-register-add-save']");
    fireEvent(saveBtn, new CustomEvent('_click'));

    expect(onSave).toHaveBeenCalledWith(['Monday', ' Tuesday'], 'weekdays', '');
  });
});
