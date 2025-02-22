import React, { FunctionComponent, useEffect, useState } from 'react';
import type { ContactInformation } from '@store/notification/models';
import styled from 'styled-components';
import { GoATextArea, GoAInput, GoAButton, GoAButtonGroup, GoAFormItem, GoAModal } from '@abgov/react-components';
import { isSmsValid, emailError, smsError } from '@lib/inputValidation';

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
      <GoAModal
        testId="edit-contact-information-notification"
        open={open}
        heading="Edit contact information"
        actions={
          <GoAButtonGroup alignment="end">
            <GoAButton testId="form-cancel" type="secondary" onClick={tryCancel}>
              Cancel
            </GoAButton>
            <GoAButton type="primary" testId="form-save" onClick={() => trySave(contactInformation)}>
              Save
            </GoAButton>
          </GoAButtonGroup>
        }
      >
        <ErrorWrapper>
          <GoAFormItem error={formErrors?.['email']} label="Email">
            <GoAInput
              type="email"
              name="email"
              width="100%"
              testId="form-email"
              value={contactInformation?.contactEmail || ''}
              aria-label="email"
              onChange={(_, value) => {
                setContactInformation({ ...contactInformation, contactEmail: value });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={formErrors?.['sms']} label="Phone number" requirement="optional">
            <GoAInput
              type="tel"
              aria-label="sms"
              name="sms"
              width="100%"
              value={contactInformation?.phoneNumber || ''}
              testId="contact-sms-input"
              onChange={(_, value) => {
                if (isSmsValid(value)) {
                  setContactInformation({ ...contactInformation, phoneNumber: value.substring(0, 10) });
                }
              }}
              trailingIcon="close"
              onTrailingIconClick={() => {
                setContactInformation({ ...contactInformation, phoneNumber: '' });
              }}
            />
          </GoAFormItem>
          <GoAFormItem error={formErrors?.['supportInstructions']} label="Support instructions">
            <GoATextArea
              rows={7}
              name="supportInstruction"
              value={contactInformation?.supportInstructions || ''}
              testId="form-support-instructions"
              aria-label="name"
              width="100%"
              onKeyPress={(name, value, key) => {
                setContactInformation({ ...contactInformation, supportInstructions: value });
              }}
              // eslint-disable-next-line
              onChange={(name, value) => {}}
            />
          </GoAFormItem>
        </ErrorWrapper>
      </GoAModal>
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
