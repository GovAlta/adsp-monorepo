import React, { FunctionComponent, useEffect, useState } from 'react';
import type { ContactInformation } from '@store/notification/models';
import styled from 'styled-components';
import { GoabTextArea, GoabInput, GoabButton, GoabButtonGroup, GoabFormItem, GoabModal } from '@abgov/react-components';
import { isSmsValid, emailError, smsError } from '@lib/inputValidation';
import { GoabTextAreaOnKeyPressDetail, GoabInputOnChangeDetail } from '@abgov/ui-components-common';

interface NotificationTypeFormProps {
  initialValue?: ContactInformation;
  onCancel?: () => void;
  onSave?: (type: ContactInformation) => void;
  open: boolean;
  errors?: Record<string, string>;
}

export const ContactInformationModalForm: FunctionComponent<NotificationTypeFormProps> = ({
  initialValue,
  onCancel,
  onSave,
  errors,
  open,
}) => {
  const x = JSON.stringify(initialValue);
  const [contactInformation, setContactInformation] = useState<ContactInformation>(JSON.parse(x));
  const [formErrors, setFormErrors] = useState(null);

  useEffect(() => {
    const x = JSON.stringify(initialValue);
    setContactInformation(JSON.parse(x));
  }, [initialValue]);

  const trySave = (contactInformation) => {
    const formErrorList = Object.assign(
      {},
      emailError(contactInformation.contactEmail),
      smsError(contactInformation.phoneNumber)
    );
    if (Object.keys(formErrorList).length === 0) {
      onSave(contactInformation);
      setFormErrors(null);
    } else {
      setFormErrors(formErrorList);
    }
  };

  const tryCancel = () => {
    const x = JSON.stringify(initialValue);
    setContactInformation(JSON.parse(x));
    setFormErrors(null);
    onCancel();
  };

  return (
    <EditStyles>
      <GoabModal
        testId="edit-contact-information-notification"
        open={open}
        heading="Edit contact information"
        actions={
          <GoabButtonGroup alignment="end">
            <GoabButton testId="form-cancel" type="secondary" onClick={tryCancel}>
              Cancel
            </GoabButton>
            <GoabButton type="primary" testId="form-save" onClick={() => trySave(contactInformation)}>
              Save
            </GoabButton>
          </GoabButtonGroup>
        }
      >
        <ErrorWrapper>
          <GoabFormItem error={formErrors?.['email']} label="Email">
            <GoabInput
              type="email"
              name="email"
              width="100%"
              testId="form-email"
              value={contactInformation?.contactEmail || ''}
              aria-label="email"
              onChange={(detail: GoabInputOnChangeDetail) => {
                setContactInformation({ ...contactInformation, contactEmail: detail.value });
              }}
            />
          </GoabFormItem>
          <GoabFormItem error={formErrors?.['sms']} label="Phone number" requirement="optional">
            <GoabInput
              type="tel"
              aria-label="sms"
              name="sms"
              width="100%"
              value={contactInformation?.phoneNumber || ''}
              testId="contact-sms-input"
              onChange={(detail: GoabInputOnChangeDetail) => {
                if (isSmsValid(detail.value)) {
                  setContactInformation({ ...contactInformation, phoneNumber: detail.value.substring(0, 10) });
                }
              }}
              trailingIcon="close"
              onTrailingIconClick={() => {
                setContactInformation({ ...contactInformation, phoneNumber: '' });
              }}
            />
          </GoabFormItem>
          <GoabFormItem error={formErrors?.['supportInstructions']} label="Support instructions">
            <GoabTextArea
              rows={7}
              name="supportInstruction"
              value={contactInformation?.supportInstructions || ''}
              testId="form-support-instructions"
              aria-label="name"
              width="100%"
              onKeyPress={(detail: GoabTextAreaOnKeyPressDetail) => {
                setContactInformation({ ...contactInformation, supportInstructions: detail.value });
              }}
              // eslint-disable-next-line
              onChange={() => {}}
            />
          </GoabFormItem>
        </ErrorWrapper>
      </GoabModal>
    </EditStyles>
  );
};

const EditStyles = styled.div`
  ul {
    margin-left: 0;
  }

  li {
    border: 1px solid #f1f1f1;
  }
`;

export const ErrorWrapper = styled.div`
  .goa-state--error {
    input,
    textarea {
      border-color: var(--color-red);
    }
  }
`;
