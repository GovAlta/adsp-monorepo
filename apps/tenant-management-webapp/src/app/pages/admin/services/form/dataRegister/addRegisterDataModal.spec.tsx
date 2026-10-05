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

  const typeName = (baseElement: HTMLElement, value: string) => {
    const nameInput = baseElement.querySelector("goa-input[testId='data-register-add-name-input']");
    fireEvent(nameInput, new CustomEvent('_change', { detail: { value } }));
  };
  const nameFormItem = (baseElement: HTMLElement) => baseElement.querySelector('goa-form-item[label="Name"]');
  const saveButton = (baseElement: HTMLElement) =>
    baseElement.querySelector("goa-button[testId='data-register-add-save']");

  it.each(['week_days', 'week days', 'Week-Days-2'])('accepts the register name "%s"', (name) => {
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} />);

    typeName(baseElement, name);

    expect(nameFormItem(baseElement)?.getAttribute('error')).toBeFalsy();
  });

  it.each(['weekdays!', 'week/days', 'a'.repeat(51)])('rejects the register name "%s"', (name) => {
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} />);

    typeName(baseElement, name);

    expect(nameFormItem(baseElement)?.getAttribute('error')).toContain(
      'letters, numbers, spaces, hyphens and underscores',
    );
  });

  it('disables save when the register name has invalid characters', () => {
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} />);

    typeName(baseElement, 'weekdays!');

    expect(saveButton(baseElement)?.getAttribute('disabled')).toBe('true');
  });

  it('shows an error when a register with the same name already exists', () => {
    const { baseElement } = render(
      <AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} existingNames={['weekdays']} />,
    );

    typeName(baseElement, 'weekdays');

    expect(nameFormItem(baseElement)?.getAttribute('error')).toBe('A register named "weekdays" already exists.');
  });

  it('disables save when a register with the same name already exists', () => {
    const { baseElement } = render(
      <AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} existingNames={['weekdays']} />,
    );

    typeName(baseElement, 'weekdays');

    expect(saveButton(baseElement)?.getAttribute('disabled')).toBe('true');
  });

  it('treats a register name differing only by case as a new register', () => {
    const { baseElement } = render(
      <AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} existingNames={['weekdays']} />,
    );

    typeName(baseElement, 'Weekdays');

    expect(nameFormItem(baseElement)?.getAttribute('error')).toBeFalsy();
  });

  it('saves the register under the trimmed name', () => {
    const onSave = jest.fn();
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={onSave} />);

    typeName(baseElement, '  weekdays  ');
    fireEvent(saveButton(baseElement), new CustomEvent('_click'));

    expect(onSave).toHaveBeenCalledWith(null, 'weekdays', '');
  });

  const selectJsonAndEnter = (baseElement: HTMLElement, value: string) => {
    const separatorDropdown = baseElement.querySelector("goa-dropdown[testId='data-register-add-data-separator']");
    fireEvent(separatorDropdown, new CustomEvent('_change', { detail: { value: 'json' } }));
    const dataInput = baseElement.querySelector("goa-textarea[testId='data-register-add-data-input']");
    fireEvent(dataInput, new CustomEvent('_change', { detail: { value } }));
    fireEvent(dataInput, new CustomEvent('_blur', { detail: { value } }));
  };

  it('saves JSON register data as parsed objects', () => {
    const onSave = jest.fn();
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={onSave} />);
    typeName(baseElement, 'provinces');

    selectJsonAndEnter(baseElement, '[{"label":"Alberta","value":"AB"}]');
    fireEvent(saveButton(baseElement), new CustomEvent('_click'));

    expect(onSave).toHaveBeenCalledWith([{ label: 'Alberta', value: 'AB' }], 'provinces', '');
  });

  it('shows an error for register data that is not valid JSON', () => {
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={() => {}} onSave={() => {}} />);

    selectJsonAndEnter(baseElement, '[Alberta');

    const formItem = baseElement.querySelector("goa-form-item[testId='data-register-add-data-formitem']");
    expect(formItem?.getAttribute('error')).toBe('Please provide valid JSON');
  });

  it('calls onCancel when cancel is clicked', () => {
    const onCancel = jest.fn();
    const { baseElement } = render(<AddRegisterDataModal open={true} onCancel={onCancel} onSave={() => {}} />);

    fireEvent(baseElement.querySelector("goa-button[testId='data-register-add-cancel']"), new CustomEvent('_click'));

    expect(onCancel).toHaveBeenCalled();
  });
});
