import { GoabFormItem, GoabInput } from '@abgov/react-components-ds1';
import { ControlProps } from '@jsonforms/core';
import { withJsonFormsControlProps } from '@jsonforms/react';
import { useState } from 'react';
import { Visible } from '../../util';
import { DEFAULT_PATTERNS, maskPlaceholder } from '../../util/patternForm';
import { useMaskedInput } from '../../util/useMaskedInput';
import { GoabInputOnChangeDetail, GoabInputOnKeyPressDetail } from '@abgov/ui-components-common';
type PhoneNumberControlProps = ControlProps;

export const PhoneNumberControl = (props: PhoneNumberControlProps): JSX.Element => {
  const { data, path, schema, uischema, handleChange, enabled, visible, required } = props;
  // Default mask can be overridden per field via the UI schema options.
  const phoneMask = (uischema?.options?.phoneMask as string) || DEFAULT_PATTERNS.phone.mask;
  // When in-place, the field shows the fill-in template and edits keep the caret in place.
  const inPlace = uischema?.options?.inPlace === true;

  const [error, setError] = useState<string>('');

  const {
    value,
    handleChange: handleMaskChange,
    handleKeyPress,
  } = useMaskedInput({
    mask: phoneMask,
    inPlace,
    data,
    onCommit: (stored) => {
      setError(stored && !DEFAULT_PATTERNS.phone.pattern.test(stored) ? DEFAULT_PATTERNS.phone.error : '');
      handleChange(path, stored);
    },
  });

  return (
    <Visible $visible={visible}>
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
          value={value}
          maxLength={inPlace ? undefined : phoneMask.length}
          placeholder={inPlace ? undefined : maskPlaceholder(phoneMask)}
          onChange={(detail: GoabInputOnChangeDetail) => handleMaskChange(detail)}
          onKeyPress={inPlace ? (detail: GoabInputOnKeyPressDetail) => handleKeyPress(detail) : undefined}
          width="100%"
        />
      </GoabFormItem>
    </Visible>
  );
};

export const GoAPhoneNumberControl = withJsonFormsControlProps(PhoneNumberControl);
