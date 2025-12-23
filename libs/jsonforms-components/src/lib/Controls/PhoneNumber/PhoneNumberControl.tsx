import { GoabFormItem, GoabInput } from '@abgov/react-components';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useState } from 'react';
import { Visible } from '../../util';
import { PHONE_REGEX } from './PhoneNumberWithTypeControl';
import { GoabInputOnChangeDetail } from '@abgov/ui-components-common';
type PhoneNumberControlProps = ControlProps;

export const PhoneNumberControl = (props: PhoneNumberControlProps): JSX.Element => {
  const { data, path, schema, handleChange, enabled, visible, required } = props;
  const [error, setError] = useState<string>('');

  const handleInputChange = (name: string, value: string) => {
    if (value && !PHONE_REGEX.test(value)) {
      setError('Must be a valid 10-digit phone number in format (000) 000-0000');
    } else {
      setError('');
    }
    handleChange(path, value);
  };

  return (
    <Visible visible={visible}>
      <GoabFormItem
        label={schema?.title || 'Phone number'}
        requirement={required ? 'required' : undefined}
        error={error}
        testId={`form-item-${path}`}
      >
        <GoabInput
          type="tel"
          name={path}
          disabled={!enabled}
          aria-label="phone number input"
          testId={`phone-input-${path}`}
          value={data || ''}
          onChange={(detail: GoabInputOnChangeDetail) => handleInputChange(detail.name, detail.value)}
          placeholder="(000) 000-0000"
          width="100%"
        />
      </GoabFormItem>
    </Visible>
  );
};

export const GoAPhoneNumberControl = withJsonFormsControlProps(PhoneNumberControl);
