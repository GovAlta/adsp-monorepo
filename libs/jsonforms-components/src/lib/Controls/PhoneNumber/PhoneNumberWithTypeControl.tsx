import styled from 'styled-components';
import { GoabFormItem, GoabInput, GoabDropdown, GoabDropdownItem } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useState } from 'react';
import { Visible } from '../../util';
import { GoabInputOnChangeDetail, GoabDropdownOnChangeDetail } from '@abgov/ui-components-common';

export const PhoneGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 0.2rem;
  align-items: start;
  margin-bottom: var(--goa-space-l) !important;

  goa-form-item {
    margin-right: 0 !important;
  }
`;

export const PHONE_REGEX = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;

export const PhoneNumberWithTypeControl = (props: ControlProps): JSX.Element => {
  const { data, path, handleChange, enabled, visible, required } = props;
  const [formData, setFormData] = useState(data || {});
  const [error, setError] = useState<string | undefined>(undefined);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateFormData = (updated: any) => {
    setFormData(updated);

    if (updated.number && !PHONE_REGEX.test(updated.number)) {
      setError('Enter a valid phone number (e.g., (780) 123-4567)');
    } else {
      setError(undefined);
    }

    handleChange(path, updated);
  };

  return (
    <Visible visible={visible}>
      <PhoneGrid>
        <GoabFormItem label="Phone type" requirement={required ? 'required' : undefined}>
          <GoabDropdown
            name="type"
            value={formData.type || ''}
            disabled={!enabled}
            onChange={(detail: GoabDropdownOnChangeDetail) => updateFormData({ ...formData, type: detail.value })}
          >
            <GoabDropdownItem value="Mobile"></GoabDropdownItem>
            <GoabDropdownItem value="Landline"></GoabDropdownItem>
          </GoabDropdown>
        </GoabFormItem>

        <GoabFormItem label="Phone number" error={error} requirement={required ? 'required' : undefined}>
          <GoabInput
            type="tel"
            name="number"
            placeholder="(000) 000-0000"
            value={formData.number || ''}
            disabled={!enabled}
            onChange={(detail: GoabInputOnChangeDetail) => updateFormData({ ...formData, number: detail.value })}
          />
        </GoabFormItem>
      </PhoneGrid>
    </Visible>
  );
};

export const GoAPhoneNumberWithTypeControl = withJsonFormsControlProps(PhoneNumberWithTypeControl);
