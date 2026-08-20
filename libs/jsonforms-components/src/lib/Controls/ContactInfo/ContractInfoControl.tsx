import React from 'react';
import { ControlProps } from '@jsonforms/core';
import { PhoneNumberControl } from '../PhoneNumber';
import { GoAEmailInput } from '../Inputs/InputEmailControl';
import { GoabDropdown, GoabDropdownItem, GoabFormItem } from '@abgov/react-components';
import { FormFieldWrapper } from './style-component';

export const ContractInfoControl = (props: ControlProps): JSX.Element => {
  const { data = {}, path, handleChange, enabled, visible, required, uischema } = props;

  const handleFieldChange = (field: string, value: string) => {
    handleChange(`${path}.${field}`, value);
  };

  const emailProps: ControlProps = {
    ...props,
    data: data?.email,
    path: `${path}.email`,
  };

  const phoneProps: ControlProps = {
    ...props,
    data: data?.phone,
    path: `${path}.phone`,
  };

  const { options } = uischema;

  const enableEmail = options?.enableEmail ?? true;
  const enablePhone = options?.enablePhone ?? true;
  const emailFirst = options?.emailFirst ?? false;

  if (!enableEmail && !enablePhone) {
    throw new Error('At least one contact method must be enabled');
  }

  return (
    <div style={{ display: visible ? 'block' : 'none' }}>
      {enableEmail && emailFirst && <GoAEmailInput {...emailProps} />}
      {enablePhone && (
        <FormFieldWrapper>
          <PhoneNumberControl {...phoneProps} />
        </FormFieldWrapper>
      )}
      {enableEmail && !emailFirst && <GoAEmailInput {...emailProps} />}

      {enableEmail && enablePhone && (
        <FormFieldWrapper>
          <GoabFormItem label="Preferred Contact Method" requirement={required ? 'required' : undefined}>
            <GoabDropdown
              testId={`preferred-contact-${path}`}
              disabled={!enabled}
              value={data.preferredContactMethod || ''}
              onChange={(detail) => handleFieldChange('preferredContactMethod', detail.value || '')}
              width="250px"
            >
              <GoabDropdownItem value="" label="Select a Contact Method" />
              {emailFirst && <GoabDropdownItem value="Email" label="Email" />}
              <GoabDropdownItem value="Phone" label="Phone" />
              {!emailFirst && <GoabDropdownItem value="Email" label="Email" />}
            </GoabDropdown>
          </GoabFormItem>
        </FormFieldWrapper>
      )}
    </div>
  );
};
